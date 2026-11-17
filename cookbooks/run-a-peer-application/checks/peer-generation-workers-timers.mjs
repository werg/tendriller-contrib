// The scheduler owns wakes and occurrence journals; the domain owns atomic guards.
import assert from 'node:assert/strict';
import { ApplicationTimerScheduler } from '@chronolog/peer-session';

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const last = entry => entry.publications.at(-1);

export async function exerciseTimers({ a, b, journal, resources, post, report, timeout, synchronize, recover, effects, provider, drain }) {
  let clock = 999, beforePublish = async () => {}, loseReply = false;
  const calls = [];
  const options = { id: 'notification-scheduler', version: '1', session: a, store: journal,
    configurationTopic: 'schedules', authorize: ({ configuration }) => configuration.author === a.deviceId,
    now: () => clock, pollMs: 10,
    publish: async (occurrence, { operationId, basedOn, reapplyOf, signal }) => {
      calls.push({ occurrenceId: occurrence.occurrenceId, operationId, reapplyOf });
      await beforePublish(occurrence);
      const handle = reapplyOf === null ? await a.command('fireNotification', occurrence, { operationId, basedOn })
        : await a.reapply(reapplyOf, 'fireNotification', occurrence, { operationId, basedOn });
      if (loseReply) { loseReply = false; await handle.applied({ signal }); throw Error('TIMER_COMMAND_REPLY_LOST'); }
      return handle;
    },
  };
  const open = async () => { const value = await ApplicationTimerScheduler.open(options); resources.push(value); return value; };
  let scheduler = await open();
  const schedule = (timerId, dueAtMs, extra = {}) => post(a, 'scheduleNotification', {
    timerId, generation: `${timerId}-version`, dueAtMs, intervalMs: null,
    payload: { message: `${timerId} notification` }, expectedGeneration: null, ...extra,
  }, `schedule-${timerId}`);
  const cancel = (timerId, device = a) => post(device, 'cancelNotification', {
    timerId, generation: `${timerId}-version`,
  }, `cancel-${timerId}`);
  const events = async () => {
    const view = await a.readView();
    try { return view.readEvents({ topics: ['notifications'], limit: 128 }).events; }
    finally { await view.release(); }
  };
  const entryFor = async timerId => (await scheduler.inspect()).occurrences.find(value => value.occurrence.timerId === timerId);

  await schedule('after-reopen', 1000);
  assert.equal((await scheduler.tick(999, { signal: timeout() })).emitted, 0);
  await scheduler.close(); scheduler = await open();
  assert.equal((await scheduler.tick(1000, { signal: timeout() })).emitted, 1);
  const first = await entryFor('after-reopen'), firstEvents = await events();
  assert.equal(last(first).status, 'applied');
  assert.equal(first.occurrence.configuration.author, a.deviceId);
  assert.deepEqual(await scheduler.retry(first.occurrence.occurrenceId, { signal: timeout() }), first);
  assert.deepEqual(await events(), firstEvents, 'Retrying an applied timer must not create another domain event');

  await schedule('cancelled-before-tick', 1200); await cancel('cancelled-before-tick');
  assert.equal((await scheduler.tick(2000, { signal: timeout() })).emitted, 0);
  assert.equal(await entryFor('cancelled-before-tick'), undefined);
  await schedule('cancelled-during-publish', 2000);
  const entered = deferred(), release = deferred(), beforeRace = await events();
  beforePublish = async occurrence => { if (occurrence.timerId === 'cancelled-during-publish') { entered.resolve(); await release.promise; } };
  const ticking = scheduler.tick(2000, { signal: timeout() });
  await entered.promise;
  // A different ordinary member wins cancellation after authorization/capture.
  // basedOn remains a valid selected prefix; the command's SQL guard decides it.
  await cancel('cancelled-during-publish', b); release.resolve();
  const race = await ticking; beforePublish = async () => {};
  assert.equal(race.emitted, 0); assert.equal(race.cancelled, 1);
  const cancelled = await entryFor('cancelled-during-publish');
  assert.equal(last(cancelled).status, 'cancelled');
  assert.equal(last(cancelled).result.rejectionCode, 'assert:timer_inactive_configuration');
  assert.deepEqual(await events(), beforeRace);

  await schedule('lost-command-reply', 3000); loseReply = true;
  await assert.rejects(scheduler.tick(3000, { signal: timeout() }), /TIMER_COMMAND_REPLY_LOST/u);
  const uncertain = await entryFor('lost-command-reply'), attempted = calls.length;
  await scheduler.close(); scheduler = await open();
  await scheduler.tick(3500, { signal: timeout() });
  const reconciled = await entryFor('lost-command-reply');
  assert.deepEqual(reconciled.occurrence, uncertain.occurrence);
  assert.equal(reconciled.publications.length, 1); assert.equal(last(reconciled).status, 'applied');
  assert.equal(calls.length, attempted, 'The owned session outcome must resolve a lost callback reply without another submission');

  await schedule('retained-configuration', 5000);
  await synchronize(); const retained = await b.recoveryPoint();
  assert.equal((await scheduler.tick(5000, { signal: timeout() })).emitted, 1);
  const completed = await entryFor('retained-configuration');
  await drain(effects);
  const completedEffect = (await effects.inspect()).find(value => value.intentKey === completed.occurrence.occurrenceId);
  assert.equal(completedEffect.stage, 'completed');
  const externalBeforeRecovery = provider.snapshot();
  await schedule('excluded-configuration', 6000);
  await scheduler.tick(5999, { signal: timeout() });
  assert.ok((await scheduler.inspect()).schedules.some(value => value.timerId === 'excluded-configuration'));
  await scheduler.close();
  const recovery = await recover(retained, 'timer-prefix-recovery');
  scheduler = await open();
  const afterReset = await scheduler.tick(7000, { signal: timeout() });
  assert.equal(afterReset.reset, true); assert.equal(afterReset.emitted, 0); assert.equal(afterReset.awaitingReconciliation, true);
  assert.equal((await scheduler.inspect()).schedules.some(value => value.timerId === 'excluded-configuration'), false);
  const abandoned = await entryFor('retained-configuration');
  assert.deepEqual(abandoned.occurrence, completed.occurrence);
  assert.equal(last(abandoned).status, 'abandoned'); assert.equal(last(abandoned).result.outcome, 'accepted');
  const restored = await scheduler.reapply(completed.occurrence.occurrenceId, { operationId: 'reviewed-timer-occurrence', signal: timeout() });
  assert.deepEqual(restored.occurrence, completed.occurrence);
  assert.equal(last(restored).status, 'applied'); assert.equal(last(restored).reapplyOf, last(completed).operationId);
  await drain(effects);
  const retainedEffect = await effects.inspect(completedEffect.effectId);
  assert.equal(retainedEffect.observedEvents.length, 2);
  assert.deepEqual(provider.snapshot(), externalBeforeRecovery, 'Explicit data reapplication must not repeat a completed external action');

  // run owns a real clock wake and the session changes subscription. The fixture
  // advances its participant clock; no recipe-owned polling loop is installed.
  await schedule('owned-clock-wake', 8000); clock = 7999;
  await scheduler.tick(clock, { signal: timeout() });
  const fired = deferred();
  beforePublish = async occurrence => { if (occurrence.timerId === 'owned-clock-wake') fired.resolve(); };
  const running = scheduler.run({ signal: timeout() }); clock = 8000;
  await Promise.race([fired.promise, running.then(() => { throw Error('TIMER_DID_NOT_WAKE'); })]);
  // inspect is queued behind the in-flight tick and sees its durable result.
  const waking = await entryFor('owned-clock-wake');
  assert.equal(last(waking).status, 'applied');
  await scheduler.close(); await running;
  assert.throws(() => scheduler.inspect(), /APPLICATION_CONSUMER_CLOSED/u);

  report.timers = { first, retryPreserved: true, cancelled, race, uncertain, reconciled,
    completed, abandoned, restored, retainedEffect, externalBeforeRecovery, externalAfterRecovery: provider.snapshot(),
    recovery, excludedConfigurationRemoved: true, afterReset, waking, clockWakeOwned: true, closed: true, calls };
}
