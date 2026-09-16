const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('Cash-X root element was not found.');
}

root.innerHTML = `
  <section>
    <h1>Cash-X</h1>
    <p>Persistencia local: spike técnico en validación.</p>
  </section>
`;
