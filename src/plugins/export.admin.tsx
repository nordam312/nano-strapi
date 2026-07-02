/**
 * The "export" plugin (admin only) — it has NO pages or menu of its own.
 * Its whole job is to INJECT a button into the articles list page.
 *
 * Notice: it never imports the articles plugin, and the articles plugin never
 * imports this. They're completely decoupled — the only link is the shared zone
 * name "articles.list.actions". This is how a plugin extends another plugin's
 * UI without either side knowing about the other: the essence of a platform.
 */

import { Button } from '../design-system/index.js';
import type { AdminPlugin } from '../client/types.js';

/** The component this plugin contributes to the articles page. */
function ExportButton() {
  return (
    <Button
      variant="secondary"
      onClick={() => alert('Exporting articles… (contributed by the export plugin)')}
    >
      ⬇ Export
    </Button>
  );
}

/** This plugin's settings page — shows under /settings/export. */
function ExportSettingsPage() {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Export settings</h2>
      <p>Configure how articles are exported.</p>
      <Button onClick={() => alert('Export settings saved')}>Save</Button>
    </div>
  );
}

const exportAdmin: AdminPlugin = {
  name: 'export',

  settings: [{ path: 'export', label: 'Export', component: ExportSettingsPage }],

  // During register, drop our button into the articles zone. The articles
  // plugin exposed <InjectionZone name="articles.list.actions" /> — we fill it.
  register(app) {
    app.injectComponent('articles.list.actions', ExportButton);
    console.log('  [admin:export] injected ExportButton into articles.list.actions');
  },
};

export default exportAdmin;
