const CDP = require('/home/chapi/.openclaw/workspace/node_modules/chrome-remote-interface');
const fs = require('fs');

(async () => {
  let client;
  try {
    const tabs = await CDP.List({ port: 9222 });
    let tab = tabs.find(t => t.type === 'page');
    if (!tab) tab = await CDP.New({ port: 9222 });
    client = await CDP({ target: tab, port: 9222 });
    const { Page, Runtime, Emulation, Network } = client;
    await Page.enable(); await Runtime.enable(); await Network.enable();
    await Network.setCacheDisabled({ cacheDisabled: true });
    await Emulation.setDeviceMetricsOverride({ width: 414, height: 900, deviceScaleFactor: 2, mobile: false });
    await Page.navigate({ url: 'http://localhost:3201/' });
    await new Promise(r => setTimeout(r, 3000));

    // Injecte une carte de démo et déclenche les animations
    const shot1 = await Runtime.evaluate({
      expression: `(async () => {
        // Force l'affichage de la vue étude
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById('viewStudy') || null;
        return 'ok';
      })()`, awaitPromise: true, returnByValue: true
    });

    // On pilote directement les classes CSS pour capturer les états
    await Runtime.evaluate({
      expression: `(() => {
        const all = [...document.querySelectorAll('.view')];
        const study = all.find(v => v.id.toLowerCase().includes('study'));
        if (study) { all.forEach(v => v.classList.add('hidden')); study.classList.remove('hidden'); }
        const wrap = document.getElementById('studyCardWrap');
        if (wrap) wrap.classList.remove('hidden');
        const done = document.getElementById('studyDone');
        if (done) done.classList.add('hidden');
        const fc = document.getElementById('flashcard');
        if (fc) {
          document.getElementById('fcLevel').textContent = 'Nouvelle';
          document.getElementById('fcFace').innerHTML = '<div class="fc-front">go</div>';
          document.getElementById('fcHint').textContent = 'Touche pour révéler';
          fc.classList.add('card-in');
        }
        return 'ready';
      })()`, returnByValue: true
    });
    await new Promise(r => setTimeout(r, 500));
    let s = await Page.captureScreenshot({ format: 'png' });
    fs.writeFileSync('/tmp/anim1_front.png', Buffer.from(s.data, 'base64'));

    // Révélation (flip)
    await Runtime.evaluate({
      expression: `(() => {
        document.getElementById('fcFace').innerHTML =
          '<div style="font-size:1.5rem;font-weight:800;color:var(--gray);margin-bottom:10px">go</div>' +
          '<div class="fc-back-main">went <span style="color:var(--red)">|</span> gone</div>' +
          '<div class="fc-extra">aller</div>';
        const f = document.getElementById('fcFace');
        f.classList.remove('fc-flip'); void f.offsetWidth; f.classList.add('fc-flip');
        document.getElementById('fcHint').textContent = "Comment ça s'est passé ?";
        document.getElementById('gradesRow').classList.remove('hidden');
        return 'revealed';
      })()`, returnByValue: true
    });
    await new Promise(r => setTimeout(r, 300));
    s = await Page.captureScreenshot({ format: 'png' });
    fs.writeFileSync('/tmp/anim2_back.png', Buffer.from(s.data, 'base64'));

    // État "bonne réponse" (flash vert)
    await Runtime.evaluate({
      expression: `(() => {
        const fc = document.getElementById('flashcard');
        fc.classList.remove('flash-good'); void fc.offsetWidth; fc.classList.add('flash-good');
        return 'good';
      })()`, returnByValue: true
    });
    await new Promise(r => setTimeout(r, 200));
    s = await Page.captureScreenshot({ format: 'png' });
    fs.writeFileSync('/tmp/anim3_good.png', Buffer.from(s.data, 'base64'));

    console.log('captures: /tmp/anim1_front.png /tmp/anim2_back.png /tmp/anim3_good.png');
  } catch (e) {
    console.error('erreur:', e.message);
  } finally {
    if (client) await client.close();
  }
})();
