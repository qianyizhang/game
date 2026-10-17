/** Download text or exact recorded bytes without coupling file controls to game sessions. */
export function downloadFile(
  contents: string | Uint8Array<ArrayBuffer>,
  name: string,
  type = 'application/json',
) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
