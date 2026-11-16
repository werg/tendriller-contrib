// This projection reads shared state only; it has no private-record operation.
const api=window.tendril;
function render(){const summary=api.state.get('findings');document.querySelector('#finding').textContent=summary?.text||'Waiting for an intentionally reviewed summary.';document.querySelector('#stamp').textContent=summary?`Reviewed source revision ${summary.source_revision}`:'';}
api.state.on(render);api.on('connect',render);render();
