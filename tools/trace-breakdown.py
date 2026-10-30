# Usage: python3 tools/trace-breakdown.py <trace.json.gz> [start_us]
# Lists the page's main-thread tasks over 1.5 ms around an interaction, in time order, with the work
# inside each (hit tests, handlers, style, layout, paint, layerize) and how many layers each frame
# updated. The trace is one saved by Chrome DevTools or the chrome-devtools MCP's performance trace;
# without start_us it starts at the first mousedown. Used to find why a tick and Plan were slow to show.
import gzip, json, sys
d = json.load(gzip.open(sys.argv[1]))
ev = d['traceEvents'] if isinstance(d, dict) else d
names = {(e['pid'], e['tid']): e['args']['name'] for e in ev if e.get('ph') == 'M' and e.get('name') == 'thread_name'}
mains = [k for k, v in names.items() if v == 'CrRendererMain']
k = max(mains, key=lambda m: sum(1 for e in ev if e.get('ph') == 'X' and (e['pid'], e['tid']) == m))
if len(sys.argv) > 2: t0 = int(sys.argv[2])
else:
    clicks = [e for e in ev if e.get('name') == 'EventDispatch' and e.get('args', {}).get('data', {}).get('type') == 'mousedown']
    t0 = clicks[0]['ts'] if clicks else ev[0]['ts']
X = sorted([e for e in ev if e.get('ph') == 'X' and (e['pid'], e['tid']) == k and t0 - 40000 <= e['ts'] <= t0 + 400000], key=lambda e: e['ts'])
skip = ('RunTask', 'v8.callFunction', 'V8.StackGuard', 'RunMicrotasks', 'v8::Debugger::AsyncTaskRun', 'UpdateLayer', 'ParseHTML')
for t in [e for e in X if e['name'] == 'RunTask' and e.get('dur', 0) > 1500]:
    agg, n = {}, {}
    for e in X:
        if e is t or not (t['ts'] <= e['ts'] < t['ts'] + t['dur']): continue
        if e['name'] == 'UpdateLayer': n['layers'] = n.get('layers', 0) + 1
        if e['name'] in skip: continue
        nm = e['name'] + ('(' + e['args']['data'].get('type', '') + ')' if e['name'] == 'EventDispatch' else '')
        agg[nm] = agg.get(nm, 0) + e.get('dur', 0) / 1000
    top = ', '.join(f"{a} {v:.0f}" for a, v in sorted(agg.items(), key=lambda x: -x[1])[:6])
    print(f"{(t['ts'] - t0) / 1000:7.1f} ms  {t['dur'] / 1000:6.1f} ms  {top}" + (f"  [{n['layers']} layer updates]" if n else ""))
