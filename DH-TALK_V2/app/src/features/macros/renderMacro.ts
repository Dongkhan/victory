export function renderMacro(template: string, patientName?: string): string {
  if (!patientName?.trim()) {
    throw new Error('환자를 먼저 선택해야 합니다.');
  }
  return template.split('{name}').join(patientName.trim());
}
