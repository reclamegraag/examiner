'use client';

import { useState, use, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { useWordSet, useWordPairs } from '@/hooks';
import { faArrowLeft, faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  PRINT_LAYOUTS,
  getLayout,
  cardsPerSheet,
  paginate,
  backOrder,
  maxFontSizePt,
  MIN_FONT_SIZE_PT,
} from '@/lib/flashcard-print';

export default function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const setId = parseInt(id);

  const { set } = useWordSet(setId);
  const { pairs } = useWordPairs(setId);

  const [layoutId, setLayoutId] = useState('3x4');
  const [rotated, setRotated] = useState(false);
  const layout = getLayout(layoutId);
  const perSheet = cardsPerSheet(layout);
  const maxFontPt = maxFontSizePt(layout.cols);

  // Stabiele volgorde, los van de Dexie-query-volgorde.
  const sorted = [...pairs].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

  const pages = paginate(sorted, perSheet);
  const sheetCount = pages.length * 2; // voor- én achterkant

  if (!set) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border rounded w-1/3" />
          <div className="h-4 bg-border rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Schermbesturing — wordt niet meegeprint */}
      <div className="no-print max-w-2xl mx-auto px-4 py-6 md:py-8">
        <Link
          href={`/sets/${setId}`}
          className="inline-flex items-center text-muted hover:text-foreground mb-4 transition-colors font-bold text-sm"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
          Terug naar set
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold font-heading break-words mb-1">
          Kaartjes afdrukken
        </h1>
        <p className="text-muted font-medium mb-6">{set.name}</p>

        <div className="bg-card border-2 border-border-bold rounded-2xl shadow-brutal-sm p-5 mb-6">
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-2">
            Kaartjes per vel
          </label>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {PRINT_LAYOUTS.map(l => (
              <button
                key={l.id}
                onClick={() => setLayoutId(l.id)}
                className={`px-3 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                  l.id === layoutId
                    ? 'bg-accent-light border-accent text-foreground'
                    : 'bg-background border-border-bold text-muted hover:text-foreground'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-2">
            Tekstrichting
          </label>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {[
              { value: false, label: 'Staand' },
              { value: true, label: 'Liggend' },
            ].map(opt => (
              <button
                key={opt.label}
                onClick={() => setRotated(opt.value)}
                className={`px-3 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                  rotated === opt.value
                    ? 'bg-accent-light border-accent text-foreground'
                    : 'bg-background border-border-bold text-muted hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-medium mb-5 -mt-2">
            Liggend draait de tekst een kwartslag. Handig voor lange woorden in
            smalle kaartjes — voor- en achterkant blijven correct uitgelijnd.
          </p>

          <div className="text-sm text-muted-foreground font-medium space-y-1 mb-5">
            <p>
              <span className="font-bold text-foreground">{sorted.length}</span> woordparen ·{' '}
              <span className="font-bold text-foreground">{pages.length}</span>{' '}
              {pages.length === 1 ? 'kaartjespagina' : "kaartjespagina's"} ·{' '}
              <span className="font-bold text-foreground">{sheetCount}</span> vellen (voor + achter)
            </p>
            <p>
              Voorkant: <span className="font-bold text-foreground uppercase">{set.languageA}</span>{' '}
              · Achterkant: <span className="font-bold text-foreground uppercase">{set.languageB}</span>
            </p>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => window.print()}
            disabled={sorted.length === 0}
            icon={<FontAwesomeIcon icon={faPrint} />}
          >
            Afdrukken
          </Button>

          {sorted.length === 0 && (
            <p className="text-sm text-error font-medium mt-3 text-center">
              Deze set heeft nog geen woorden om af te drukken.
            </p>
          )}
        </div>

        <div className="bg-background border-2 border-border rounded-2xl p-4 text-sm text-muted-foreground font-medium space-y-2">
          <p className="font-bold text-foreground">Printinstellingen</p>
          <p>
            Kies in het printdialoog <span className="font-bold text-foreground">dubbelzijdig</span>{' '}
            en omslaan langs de <span className="font-bold text-foreground">lange zijde</span>. Zet de
            schaal op 100% (geen &quot;aanpassen aan pagina&quot;) zodat voor- en achterkant netjes
            uitgelijnd blijven. Knip daarna langs de stippellijnen.
          </p>
          <p>
            Tip: druk eerst één vel af om te controleren of voor- en achterkant goed op elkaar
            aansluiten op jouw printer.
          </p>
        </div>
      </div>

      {/* Afdrukbare vellen */}
      <div className="print-root">
        {pages.map((page, pageIndex) => {
          const fronts = page;
          const backs = backOrder(page, layout.cols);
          return (
            <div key={pageIndex} className="print-pair">
              <Sheet
                cells={fronts.map(p => p?.termA ?? '')}
                cols={layout.cols}
                rows={layout.rows}
                maxFontPt={maxFontPt}
                rotated={rotated}
              />
              <Sheet
                cells={backs.map(p => p?.termB ?? '')}
                cols={layout.cols}
                rows={layout.rows}
                maxFontPt={maxFontPt}
                rotated={rotated}
              />
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        .print-root {
          display: none;
        }

        .print-sheet {
          width: 210mm;
          height: 297mm;
          padding: 10mm;
          box-sizing: border-box;
          background: #ffffff;
        }

        .print-grid {
          display: grid;
          width: 100%;
          height: 100%;
        }

        .print-cell {
          border: 1px dashed #999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3mm;
          overflow: hidden;
          color: #000000;
        }

        .print-cell-text {
          /* Breedte wordt per cel via JS gezet (auto-fit), dus niet door flex
             laten krimpen — anders klopt de gemeten regelbreedte niet. */
          flex: 0 0 auto;
          width: 100%;
          text-align: center;
          line-height: 1.15;
          transform-origin: center center;
          /* Breek alleen op spaties — nooit middenin een woord. De auto-fit
             verkleint de tekst tot ze netjes in de cel past. */
          white-space: normal;
          overflow-wrap: normal;
          word-break: normal;
          hyphens: none;
        }

        @media screen {
          .print-root {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            justify-content: center;
            padding: 0 16px 40px;
          }
          .print-pair {
            display: contents;
          }
          .print-sheet {
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
            border: 1px solid #d4cbc0;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html,
          body {
            background: #ffffff !important;
            background-image: none !important;
            /* Voorkom dat de schermhoogte (100vh) een extra lege pagina forceert. */
            min-height: 0 !important;
          }
          /* Verberg de app-chrome en schermbesturing tijdens het printen */
          nav,
          .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            min-height: 0 !important;
          }
          .print-root {
            display: block;
          }
          .print-sheet {
            /* Iets onder de volle A4-hoogte zodat sub-pixel-afronding nooit een
               flinter naar een tweede pagina duwt. Elk vel blijft één A4-pagina. */
            height: 296mm;
            overflow: hidden;
            break-inside: avoid;
            page-break-inside: avoid;
            break-after: page;
            page-break-after: always;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-pair:last-child .print-sheet:last-child {
            break-after: auto;
            page-break-after: auto;
          }
        }
      `}</style>
    </>
  );
}

function Sheet({
  cells,
  cols,
  rows,
  maxFontPt,
  rotated,
}: {
  cells: string[];
  cols: number;
  rows: number;
  maxFontPt: number;
  rotated: boolean;
}) {
  return (
    <div className="print-sheet">
      <div
        className="print-grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {cells.map((text, i) => (
          <div key={i} className="print-cell">
            <AutoFitText text={text} maxPt={maxFontPt} rotated={rotated} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Toont tekst en verkleint de lettergrootte automatisch (binaire zoektocht)
 * tot het hele woord/de hele zin zonder overloop binnen de cel past. Korte
 * woorden blijven groot en goed leesbaar; lange woorden of zinnen krimpen
 * netjes mee in plaats van lelijk middenin een woord af te breken.
 *
 * Omdat zowel het scherm als de afdruk dezelfde absolute eenheden (mm/pt)
 * gebruiken, klopt de op het scherm berekende grootte ook bij het printen.
 *
 * Bij `rotated` wordt de tekst een kwartslag gedraaid (liggend). Voor- en
 * achterkant gebruiken bewust dezelfde draairichting: elke zijde wordt los van
 * elkaar recht bekeken, dus net als bij rechte tekst leest beide kanten goed.
 * De positie-spiegeling voor dubbelzijdig printen zit in `backOrder` en blijft
 * ongewijzigd, zodat elke achterkant achter de eigen voorkant valt.
 */
function AutoFitText({
  text,
  maxPt,
  rotated,
}: {
  text: string;
  maxPt: number;
  rotated: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cell = el.parentElement;
    if (!cell || !text) {
      if (el) el.style.fontSize = `${maxPt}pt`;
      return;
    }

    const fit = () => {
      const cs = getComputedStyle(cell);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const availW = cell.clientWidth - padX;
      const availH = cell.clientHeight - padY;
      if (availW <= 0 || availH <= 0) return;

      // Bij liggende tekst wisselen de lengte- en dwarsrichting om: de regels
      // lopen langs de hoogte van de cel en de tekst mag zo "breed" worden als
      // de cel hoog is. De rotatie zelf (transform) verandert de lay-outdozen
      // niet, dus meten we in de niet-gedraaide ruimte met omgewisselde maten.
      const along = rotated ? availH : availW; // regelbreedte (leesrichting)
      const across = rotated ? availW : availH; // totale teksthoogte (dwars)

      el.style.width = `${along}px`;

      // Begin zonder afbreken; alleen als zelfs de kleinste maat een enkel woord
      // niet kan laten passen, staan we afbreken toe als laatste redmiddel.
      el.style.overflowWrap = 'normal';

      let lo = MIN_FONT_SIZE_PT;
      let hi = maxPt;
      let best = MIN_FONT_SIZE_PT;
      for (let i = 0; i < 9; i++) {
        const mid = (lo + hi) / 2;
        el.style.fontSize = `${mid}pt`;
        const fits = el.scrollWidth <= el.clientWidth + 0.5 && el.scrollHeight <= across + 0.5;
        if (fits) {
          best = mid;
          lo = mid;
        } else {
          hi = mid;
        }
      }
      el.style.fontSize = `${best}pt`;

      // Laatste redmiddel: één extreem lang woord dat zelfs op de minimummaat
      // breder is dan de regel — dan toch laten afbreken zodat niets wegvalt.
      if (el.scrollWidth > el.clientWidth + 0.5) {
        el.style.overflowWrap = 'break-word';
      }
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(cell);
    return () => observer.disconnect();
  }, [text, maxPt, rotated]);

  return (
    <div
      ref={ref}
      className="print-cell-text"
      style={{
        fontSize: `${maxPt}pt`,
        transform: rotated ? 'rotate(-90deg)' : undefined,
      }}
    >
      {text}
    </div>
  );
}
