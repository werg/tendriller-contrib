const executableLanguages = new Set(['js', 'javascript', 'mjs', 'cjs', 'ts', 'typescript', 'mts', 'tsx', 'jsx', 'html']);
const historicalLabels = new Set(['historical', 'archived', 'retired']);

// Check executable Markdown examples without treating source-provenance links or
// discussion of removed APIs as current instructions. Archived code can use a
// text fence or an explicit historical/archived/retired fence label.
function activeExamples(source) {
  const code = [];
  let fence;
  for (const line of source.split(/\r?\n/u)) {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(line);
    if (fence) {
      if (marker && marker[1][0] === fence.character
          && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
      else if (fence.active) code.push(line);
    } else if (marker) {
      const [language, ...labels] = marker[2].trim().toLowerCase().split(/\s+/u);
      fence = { character: marker[1][0], length: marker[1].length,
        active: executableLanguages.has(language) && !labels.some(label => historicalLabels.has(label)) };
    }
  }
  return code.join('\n');
}

export function publicSourceViolations(source, { markdown = false } = {}) {
  const code = markdown ? activeExamples(source) : source;
  const errors = [];
  if (/\btendrilSnippets\b|\bTendrilWorkflows\b|\bsessions\s*\.\s*activate\b|\btendril\s*\.\s*control\b|\bconnectHostedSignals\b|\bconnectSignals\b/u.test(code)) {
    errors.push('retains a retired API');
  }
  if (/(?:\.\.\/)+(?:tendriller|chronolog-db)\/(?:server|runtime|contract|packages)\//u.test(code)) {
    errors.push('imports private sibling source');
  }
  return errors;
}
