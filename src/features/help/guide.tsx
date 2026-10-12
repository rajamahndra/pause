'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Wind, Scan, Square, Play } from 'lucide-react';
import help from '../../../content/help.json';
import { request } from '@/lib/client';
import { PLAN_ENABLED } from '@/lib/features';
import type { Plan } from '@/lib/types';
export function Medical() {
  return (
    <details className="medical">
      <summary>Kapan mencari bantuan medis</summary>
      <p>{help.medical}</p>
      <p>
        <strong>{help.medicalAction}</strong>
      </p>
      <p>{help.professional}</p>
    </details>
  );
}
export function HelpHome() {
  const [plan, setPlan] = useState<Plan | null>(null);
  useEffect(() => {
    if (!PLAN_ENABLED) return;
    const load = () =>
      request<Plan | null>('plan')
        .then(setPlan)
        .catch(() => setPlan(null));
    const clear = () => setPlan(null);
    load();
    const interval = setInterval(load, 60000);
    window.addEventListener('focus', load);
    window.addEventListener('offline', clear);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', load);
      window.removeEventListener('offline', clear);
    };
  }, []);
  return (
    <>
      <span className="eyebrow">DI SINI, SAAT INI</span>
      <h1>
        Berikan dirimu
        <br />
        <em>sedikit ruang.</em>
      </h1>
      <p>{help.intro}</p>
      <div className="help-options">
        <Link href="/bantuan/napas" className="panel help-option">
          <Wind size={27} />
          <h2>Panduan napas</h2>
          <p>Ikuti napas lembut, sesuai kenyamananmu.</p>
          <span className="text-link">
            Buka panduan <ArrowRight size={17} />
          </span>
        </Link>
        <Link href="/bantuan/fokus" className="panel help-option panel-sage">
          <Scan size={27} />
          <h2>Fokus ke sekitar</h2>
          <p>Arahkan perhatian ke hal-hal di sekelilingmu.</p>
          <span className="text-link">
            Buka panduan <ArrowRight size={17} />
          </span>
        </Link>
      </div>
      {PLAN_ENABLED && plan && (
        <div className="panel" style={{ textAlign: 'left' }}>
          <h2>Rencana dukunganmu</h2>
          <p>{plan.reminder}</p>
          <ol>
            {plan.steps.map((s, i) => (
              <li key={i}>{s.text}</li>
            ))}
          </ol>
          <Link href="/app/rencana" className="text-link">
            Buka rencana & kontak <ArrowRight size={17} />
          </Link>
        </div>
      )}
      <Link className="text-link" href="/offline-help/index.html">
        Buka bantuan tanpa internet <ArrowRight size={16} />
      </Link>
      <Medical />
    </>
  );
}
export function BreathGuide() {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReduced(media.matches);
      setPhase(false);
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  // Restart the phase timer when the visual mode changes to keep the motion and label together.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setPhase((p) => !p), 4000);
    return () => clearInterval(id);
  }, [running, textMode, reduced]);
  useEffect(() => {
    document.documentElement.dataset.pauseBusy = String(running);
    window.dispatchEvent(new CustomEvent('pause-busy', { detail: running }));
    return () => {
      document.documentElement.dataset.pauseBusy = 'false';
      window.dispatchEvent(new CustomEvent('pause-busy', { detail: false }));
    };
  }, [running]);
  return (
    <>
      <span className="eyebrow">PANDUAN NAPAS</span>
      <h1>
        Pelan-pelan,
        <br />
        <em>sesuai ritmemu.</em>
      </h1>
      <p>{help.breath}</p>
      {textMode || reduced ? (
        <div className="guide-step">
          <h2>{running ? (phase ? 'Hembuskan lembut.' : 'Tarik napas lembut.') : 'Tidak perlu terburu.'}</h2>
          <p>Tarik dan hembuskan napas senyaman mungkin. Tidak perlu menahan napas atau mengikuti tempo.</p>
        </div>
      ) : (
        <div className={'breath-circle' + (running ? ' running' : '')} data-phase={running ? (phase ? 'exhale' : 'inhale') : 'idle'}>
          <div className="breath-visual" aria-hidden="true">
            <svg className="breath-motion" viewBox="0 0 200 200" focusable="false">
              <circle cx="100" cy="100" r="90" pathLength="100" strokeDasharray="36 64" transform="rotate(-90 100 100)" />
              <circle cx="100" cy="100" r="88" pathLength="100" strokeDasharray="22 78" transform="rotate(90 100 100)" opacity="0.5" />
            </svg>
          </div>
          <span>{running ? (phase ? 'hembuskan' : 'tarik napas') : 'sesuai ritmemu'}</span>
        </div>
      )}
      <div className="guide-controls">
        <button
          className="button"
          onClick={() => {
            setRunning(!running);
            setPhase(false);
          }}
        >
          {running ? <Square size={16} /> : <Play size={16} />} {running ? 'Hentikan panduan' : 'Mulai panduan'}
        </button>
        <button
          className="button button-outline"
          onClick={() => {
            setTextMode(!textMode);
            setPhase(false);
          }}
        >
          {textMode ? 'Gunakan animasi' : 'Mode teks'}
        </button>
      </div>
      <p className="hint">{help.discomfort}</p>
      <Link className="text-link" href="/bantuan/fokus">
        Pilih fokus ke sekitar <ArrowRight size={16} />
      </Link>
      <Medical />
    </>
  );
}
export function FocusGuide() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.pauseBusy = String(!done);
    window.dispatchEvent(new CustomEvent('pause-busy', { detail: !done }));
    return () => {
      document.documentElement.dataset.pauseBusy = 'false';
      window.dispatchEvent(new CustomEvent('pause-busy', { detail: false }));
    };
  }, [done]);
  return (
    <>
      <span className="eyebrow">FOKUS KE SEKITAR</span>
      <h1>
        Satu hal,
        <br />
        <em>pada satu waktu.</em>
      </h1>
      {done ? (
        <div className="guide-step">
          <h2>Terima kasih sudah memberi ruang.</h2>
          <p>Tidak ada perasaan tertentu yang harus dicapai. Kamu boleh berhenti di sini.</p>
        </div>
      ) : (
        <div className="guide-step">
          <span className="step-count">
            LANGKAH {step + 1} / {help.steps.length}
          </span>
          <h2>{help.steps[step].title}</h2>
          <p>{help.steps[step].text}</p>
        </div>
      )}
      <div className="guide-controls">
        {!done ? (
          <>
            <button className="button" onClick={() => (step < help.steps.length - 1 ? setStep(step + 1) : setDone(true))}>
              Lanjut <ArrowRight size={17} />
            </button>
            <button className="button button-outline" onClick={() => (step < help.steps.length - 1 ? setStep(step + 1) : setDone(true))}>
              Lewati
            </button>
            <button className="text-link" onClick={() => setDone(true)}>
              Selesai
            </button>
          </>
        ) : (
          <>
            <Link className="button" href="/bantuan">
              Kembali ke pilihan
            </Link>
            <button
              className="button button-outline"
              onClick={() => {
                setStep(0);
                setDone(false);
              }}
            >
              Mulai lagi
            </button>
          </>
        )}
      </div>
      <Link className="text-link" href="/bantuan/napas">
        Pilih panduan napas <ArrowRight size={16} />
      </Link>
      <Medical />
    </>
  );
}
