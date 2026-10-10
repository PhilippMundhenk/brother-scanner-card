import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { CardConfig, HomeAssistant } from './types';

const ALL_TARGETS = ['file', 'ocr', 'email', 'image'];

/** Visual editor: uses ha-form (shipped with the frontend) for the fields. */
export class BrotherScannerCardEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config?: CardConfig;

  public setConfig(config: CardConfig): void {
    this.config = config;
  }

  private get schema() {
    return [
      {
        name: 'entity',
        required: true,
        selector: { entity: { domain: 'sensor', integration: 'brother_scanner' } },
      },
      { name: 'name', selector: { text: {} } },
      {
        type: 'grid',
        name: '',
        schema: [
          { name: 'show_image', selector: { boolean: {} } },
          { name: 'show_buttons', selector: { boolean: {} } },
          { name: 'show_selects', selector: { boolean: {} } },
          { name: 'show_last_scan', selector: { boolean: {} } },
          { name: 'show_link', selector: { boolean: {} } },
          { name: 'compact', selector: { boolean: {} } },
        ],
      },
      { name: 'image', selector: { text: {} } },
      {
        name: 'buttons',
        selector: { select: { multiple: true, mode: 'list', options: ALL_TARGETS.map((t) => ({ value: t, label: t })) } },
      },
    ];
  }

  private labels: Record<string, string> = {
    entity: 'Scanner state sensor',
    name: 'Name (optional)',
    show_image: 'Show picture',
    show_buttons: 'Show scan buttons',
    show_selects: 'Show resolution / mode / source',
    show_last_scan: 'Show last scan',
    show_link: 'Link to the web UI',
    compact: 'Compact',
    image: 'Picture URL (optional, overrides the integration)',
    buttons: 'Buttons to show (empty: all enabled actions)',
  };

  protected render() {
    if (!this.hass || !this.config) return nothing;
    const data = {
      show_image: true,
      show_buttons: true,
      show_selects: false,
      show_last_scan: true,
      show_link: true,
      compact: false,
      ...this.config,
    };
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${this.schema}
        .computeLabel=${(s: { name: string }) => this.labels[s.name] || s.name}
        @value-changed=${this.valueChanged}
      ></ha-form>
    `;
  }

  private valueChanged(ev: CustomEvent): void {
    const value = { ...ev.detail.value } as CardConfig;
    if (Array.isArray(value.buttons) && value.buttons.length === 0) delete value.buttons;
    if (value.image === '') delete value.image;
    if (value.name === '') delete value.name;
    this.config = value;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: value }, bubbles: true, composed: true }));
  }

  static styles = css`
    ha-form {
      display: block;
    }
  `;
}

customElements.define('brother-scanner-card-editor', BrotherScannerCardEditor);
