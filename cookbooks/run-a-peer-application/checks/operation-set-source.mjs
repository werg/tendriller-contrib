// Single-format deletion gate for the executable peer consumers and specimens.
export function operationSetSourceViolations(source) {
  const errors=[];
  if (/peer-generation-v1|eligible-members-v1|createGenerationRegistry|signTransitionRequest|signControlRevision|signApplicationDescriptor|AbandonedOperationError/u.test(source)) errors.push('removed ordering authority API');
  if (/\.(?:takeover|handover|reapply|recoveryPoint|connectControlParticipant|applied|shared)\s*\(/u.test(source)) errors.push('removed operation or recovery API');
  if (/\b(?:openNativeApplication|openBrowserApplication|openSqlApplication|prepareSqlApplication|connectApplications|connectApplicationWorker)\s*\(/u.test(source)) errors.push('removed session composition entry');
  if (/\b(?:schemaAdministrator|schemaDigest)\s*:/u.test(source)) errors.push('fixed application schema admission');
  return errors;
}
