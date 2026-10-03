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

  window.claude = {
    use: function (name) {
      return ready.then(function (session) {
        if (!session) return null;
        if (name === "user") return { id: function () { return Promise.resolve(session.user.id); } };
        if (name === "db") return { doc: function (path) { return /^data\/users\/[^/]+\/progress$/.test(path) ? progress : null; } };
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

  // The account control, placed with the page's own settings buttons.
  function control(session) {
    var host = document.querySelector(".settings");
    if (!host) return;
    var seg = document.createElement("div");
    seg.className = "seg tools account";
    seg.setAttribute("role", "group");
    seg.setAttribute("aria-label", "Account");
    var btn = document.createElement("button");
    btn.type = "button";
    if (session) {
      var who = (session.user && session.user.email) || "your account";
      btn.textContent = "Sign out";
      btn.title = "Signed in as " + who + ". Ticks are kept with your account.";
      btn.addEventListener("click", function () { sb.auth.signOut().finally(function () { location.reload(); }); });
    } else {
      btn.textContent = "Sign in";
      btn.title = "Sign in with Google to keep your Ticks on every device. Without it they stay in this browser.";
      btn.addEventListener("click", function () {
        btn.disabled = true;
        sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + "/" } });
      });
    }
    seg.appendChild(btn);
    var about = host.querySelector("#about-pop");
    host.insertBefore(seg, about || null);
  }
  function whenReady(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }
  ready.then(function (session) { whenReady(function () { control(session); }); });
})();
