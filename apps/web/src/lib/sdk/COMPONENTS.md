# WebOS SDK - Komponensek használata

Ez a dokumentum bemutatja, hogyan használhatod a WebOS core komponenseit a pluginjaidban az SDK-n keresztül.

## ContentSection komponens

A `ContentSection` egy strukturált tartalom megjelenítő komponens, amely címkével, leírással és opcionális info blokkkal rendelkezik.

### Használat pluginban

```javascript
// A ContentSection elérhető az SDK-n keresztül
const ContentSection = window.webOS.components.ContentSection;

// Svelte komponensben használva
import { mount } from 'svelte';

// Példa: Beállítások megjelenítése ContentSection-nel
const component = mount(ContentSection, {
	target: document.getElementById('settings-container'),
	props: {
		title: 'Tálca pozíció',
		description: 'Válaszd ki, hol jelenjen meg a tálca',
		contentPosition: 'bottom',
		children: (target) => {
			// Itt jön a tartalom (pl. gombok, kapcsolók)
			const buttonContainer = document.createElement('div');
			buttonContainer.className = 'button-groups';
			// ... gombok hozzáadása
			return buttonContainer;
		},
		info: (target) => {
			// Opcionális info blokk
			const infoText = document.createElement('p');
			infoText.textContent = 'Ez egy információs szöveg a beállításról';
			return infoText;
		}
	}
});
```

### Props

- `title` (string, kötelező): A szekció címe
- `description` (string, opcionális): A szekció leírása
- `info` (Snippet, opcionális): Info blokk snippet
- `disabled` (boolean, opcionális): Letiltott állapot (alapértelmezett: false)
- `contentPosition` ('bottom' | 'right', opcionális): Tartalom pozíciója (alapértelmezett: 'right')
- `children` (Snippet, opcionális): A szekció tartalma

### Példa: Kapcsoló beállítás

```javascript
const ContentSection = window.webOS.components.ContentSection;
const Switch = window.webOS.components.Switch; // Ha elérhető

mount(ContentSection, {
	target: container,
	props: {
		title: 'Értesítések engedélyezése',
		description: 'Kapj értesítéseket az új eseményekről',
		contentPosition: 'right',
		children: (target) => {
			return mount(Switch, {
				target,
				props: {
					checked: true,
					onCheckedChange: (checked) => {
						console.log('Switch changed:', checked);
					}
				}
			});
		}
	}
});
```

### Stílusok

A `ContentSection` automatikusan használja a WebOS core stílusokat, beleértve:

- Téma támogatás (világos/sötét mód)
- Konzisztens színek és tipográfia
- Reszponzív elrendezés

Nem kell külön CSS-t írni, a komponens magával hozza az összes szükséges stílust.

## Elérhető komponensek

Az SDK `components` objektumán keresztül az alábbi komponensek érhetők el:

- `ContentSection` - Strukturált tartalom megjelenítő
- `AppLayout` - Alkalmazás layout wrapper
- `DataTable` - Adattábla komponens
- `DataTableColumnHeader` - Tábla oszlop fejléc
- `DataTableFacetedFilter` - Tábla szűrő
- `Input` - Input mező
- `Button` - Gomb komponens
- `renderComponent` - Komponens renderelő helper
- `renderSnippet` - Snippet renderelő helper
- `createActionsColumn` - Akció oszlop létrehozó
- `DataTableRowActions` - Az akció oszlop gombcsoportja (primary gomb + ⋮ menü) táblázaton kívüli listákhoz; props: `actions`, `row`

### Komponensek ellenőrzése

```javascript
// Ellenőrizd, hogy mely komponensek érhetők el
console.log('Elérhető komponensek:', Object.keys(window.webOS.components));

// Ellenőrizd, hogy egy adott komponens elérhető-e
if (window.webOS.components.ContentSection) {
	console.log('ContentSection elérhető!');
}
```
