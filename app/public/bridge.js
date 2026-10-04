// Provides the two runtime calls the tracker page uses on claude.ai, window.claude.use("user")
// and window.claude.use("db"), on top of Supabase, so the same page runs here unchanged.
// Signed out (a Guest), both resolve to null and the page keeps Ticks in this browser only.
// Signed in, the progress document is one row in public.progress, readable and writable only by
// its owner (row-level security), and every save goes through save_progress, which merges by the
// same rule as the page: per task, the later change wins.
(function () {
  "use strict";
  var cfg = window.TRACKER_CONFIG;
  if (!cfg || !window.supabase) return;

  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.anonKey, {
    auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  });

  var ready = sb.auth.getSession()
    .then(function (r) { return (r && r.data && r.data.session) || null; })
    .catch(function () { return null; })
    .then(function (session) {
      // Drop the one-time ?code= from the address after the sign-in redirect.
      var u = new URL(location.href);
      if (u.searchParams.has("code")) { u.searchParams.delete("code"); history.replaceState(null, "", u.pathname + u.search + u.hash); }
      return session;
    });

  var progress = {
    get: function () {
      return sb.from("progress").select("doc").maybeSingle().then(function (r) {
        if (r.error) throw r.error;
        return { data: r.data ? r.data.doc : null };
      });
    },
    set: function (doc) {
      return sb.rpc("save_progress", { incoming: doc }).then(function (r) { if (r.error) throw r.error; });
    },
  };

  // The Student's own Canvas token: kept in this browser only, sent to the relay per request,
  // never stored on the server (ADR 0001). Works with or without signing in.
  var TOKEN_KEY = "ltu-canvas-token";
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  var canvas = {
    has: function () { return !!ls(TOKEN_KEY); },
    hint: function () { var t = ls(TOKEN_KEY) || ""; return t ? t.slice(0, t.indexOf("~") + 1) + "..." + t.slice(-4) : ""; },
    set: function (t) { t = String(t || "").trim(); if (!/^\d+~[A-Za-z0-9]{20,}$/.test(t)) return false; ls(TOKEN_KEY, t); return true; },
    forget: function () { ls(TOKEN_KEY, null); },
    read: function (courseIds) {
      var t = ls(TOKEN_KEY);
      if (!t) return Promise.resolve(null);
      // Signed in, the session goes along, so the app can record the Group Canvas names as verified.
      return sb.auth.getSession().then(function (r) {
        var h = { "content-type": "application/json", "x-canvas-token": t }, at = r && r.data && r.data.session && r.data.session.access_token;
        if (at) h.authorization = "Bearer " + at;
        return fetch("/api/me/canvas", { method: "POST", headers: h, body: JSON.stringify({ courses: courseIds }) });
      })
        .then(function (res) { return res.json().then(function (body) { if (!res.ok) { var e = new Error(body.error || "canvas"); e.code = body.error || "canvas"; throw e; } return body; }); });
    },
  };

  window.claude = {
    use: function (name) {
      if (name === "canvas") return Promise.resolve(canvas);
      return ready.then(function (session) {
        if (!session) return null;
        if (name === "user") return { id: function () { return Promise.resolve(session.user.id); } };
        if (name === "db") return { doc: function (path) { return /^data\/users\/[^/]+\/progress$/.test(path) ? progress : null; } };
        // Not part of the claude.ai runtime: lab Bookings from the signup sheets (signed in only).
        if (name === "bookings") return {
          read: function (groups) {
            return sb.auth.getSession().then(function (r) {
              var t = r && r.data && r.data.session && r.data.session.access_token;
              if (!t) return null;
              return fetch("/api/bookings?groups=" + encodeURIComponent(groups), { headers: { authorization: "Bearer " + t } })
                .then(function (res) { return res.ok ? res.json() : null; });
            });
          },
        };
        // Calendar Links (signed in): stored with the Account, read only by their owner (RLS).
        if (name === "calendars") return {
          list: function () { return sb.from("calendar_link").select("id,label,url").order("created_at").then(function (r) { if (r.error) throw r.error; return r.data; }); },
          add: function (url, label) { return sb.from("calendar_link").insert({ url: url, label: label || "" }).then(function (r) { if (r.error) throw r.error; }); },
          remove: function (id) { return sb.from("calendar_link").delete().eq("id", id).then(function (r) { if (r.error) throw r.error; }); },
          events: function () {
            return sb.auth.getSession().then(function (r) {
              var t = r && r.data && r.data.session && r.data.session.access_token;
              if (!t) return null;
              return fetch("/api/me/calendar", { headers: { authorization: "Bearer " + t } }).then(function (res) { return res.ok ? res.json() : null; });
            });
          },
        };
        // Cards (release 4, Votes since migration 012): every rule is in the database (who sees, who votes).
        if (name === "cards") {
          var me = session.user.id, ok = function (r) { if (r.error) throw r.error; return r.data; };
          return {
            me: me,
            list: function () { return sb.from("card").select("id,kind,prompt,answer,sources,course,group_number,owner,ai_drafted,status,updated_at").limit(2000).then(ok); },
            votes: function () { return sb.from("card_vote").select("card_id,user_id,vote,reason").limit(20000).then(ok); },
            reviews: function () { return sb.from("review").select("card_id,fsrs,due").then(ok); },
            maintainer: function () { return sb.rpc("is_maintainer").then(ok); },
            groups: function () { return sb.from("group_member").select("course,group_number").then(ok); },
            add: function (c) { return sb.from("card").insert(c).then(ok); },
            // One Vote per Card per Student: "legit" or "fix" (with a reason); casting again changes it.
            vote: function (id, vote, reason) { return sb.from("card_vote").upsert({ card_id: id, user_id: me, vote: vote, reason: reason || "", at: new Date().toISOString() }).then(ok); },
            unvote: function (id) { return sb.from("card_vote").delete().eq("card_id", id).eq("user_id", me).then(ok); },
            settle: function (id, keep) { return sb.rpc("settle_flag", { target: id, keep: keep }).then(ok); },
            review: function (id, fsrs, due) { return sb.from("review").upsert({ user_id: me, card_id: id, fsrs: fsrs, due: due, updated_at: new Date().toISOString() }).then(ok); },
          };
        }
        // Not part of the claude.ai runtime: the hosted app's own account calls.
        if (name === "account") return {
          email: (session.user && session.user.email) || null,
          // Deletes the account and its progress on the server, then signs out. Ticks in this
          // browser stay, as for a Guest.
          remove: function () {
            return sb.rpc("delete_my_account").then(function (r) { if (r.error) throw r.error; return sb.auth.signOut(); });
          },
        };
        return null;
      });
    },
  };

  // The account control, in the page's profile menu (the person icon, top right).
  function control(session) {
    var host = document.getElementById("acct-slot") || document.querySelector(".settings");
    if (!host) return;
    var seg = document.createElement("div");
    seg.className = "account";
    var whoEl = document.getElementById("pp-who");
    if (whoEl) whoEl.textContent = session ? ((session.user && session.user.email) || "Signed in").split("@")[0] : "Guest";
    var btn = document.createElement("button");
    btn.type = "button";
    if (session) {
      var who = (session.user && session.user.email) || "your account";
      btn.textContent = "Sign out";
      var p = document.createElement("p"); p.className = "note"; p.textContent = "Signed in as " + who0(session); seg.appendChild(p);
      btn.title = "Signed in as " + who + ". Ticks are kept with your account.";
      btn.addEventListener("click", function () { sb.auth.signOut().finally(function () { location.reload(); }); });
    } else {
      btn.textContent = "Sign in with Google";
      btn.title = "Sign in with Google to keep your Ticks on every device. Without it they stay in this browser.";
      btn.addEventListener("click", function () {
        btn.disabled = true;
        sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + "/" } });
      });
    }
    seg.appendChild(btn);
    host.appendChild(seg);
  }
  function who0(session) { return (session && session.user && session.user.email) || "your account"; }
  function whenReady(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }
  ready.then(function (session) { whenReady(function () { control(session); }); });
})();
