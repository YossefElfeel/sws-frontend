import { useState } from 'react';
import { Banner } from './Banner';
import { Button } from './Button';
import { DevNote } from './DevNote';
import { Modal } from './Modal';
import { Select } from './Select';
import { Tag } from './Tag';
import { IconPower } from './icons';
import { useLocale } from '../lib/locale';
import type { Service } from '../lib/account';

/** running → the machine answers. stopped → it does not. rescue → it answers as something else. */
type Power = 'running' | 'stopped' | 'rescue';

/** Every act that needs more than a press before it happens. `null` is the resting screen. */
type Flow = 'stop' | 'poweroff' | 'restart' | 'reinstall' | 'vnc' | 'rootpw' | 'hostname' | 'rescue';

const POWER_TONE: Record<Power, 'ok' | 'neutral' | 'warn'> = {
  running: 'ok',
  stopped: 'neutral',
  rescue: 'warn',
};

/**
 * A fixture, and the one piece of invented data on this card.
 *
 * The real list belongs to whichever virtualisation panel sits behind the product, and it
 * changes when that panel's images change. The reinstall dialog says so next to the field
 * rather than letting four plausible names review as the catalogue.
 */
const IMAGES = ['Ubuntu 24.04 LTS', 'Debian 12', 'AlmaLinux 9', 'Rocky Linux 9', 'Windows Server 2022'];

/** RFC 1123: labels of letters, digits and hyphens, not starting or ending on a hyphen. */
const HOSTNAME = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*$/i;

/**
 * The server controls — spec 9.3, the row the VPS page was missing.
 *
 * A VPS is the one product in the catalogue the client area cannot only *describe*. Everything
 * else here is a subscription with a panel behind it; this is a machine, and the questions it
 * raises — it is not answering, I need a console, I locked myself out, I want it back to
 * factory — are all answered by a button that does something to the machine rather than by a
 * link to somewhere else. The graphs underneath say what it has been doing; these say what to
 * do about it, which is why they sit above them.
 *
 * Two rows, because they are two kinds of act. The first is the power switch: four states of
 * on and off, and at most two of them are ever available, so the row is mostly disabled at any
 * moment and that is the row telling you what the machine is doing. The second is the work you
 * do to a machine you can already reach.
 *
 * Every act that needs a choice, a field, or a warning opens a dialog — reinstall erases the
 * disk, rescue boots a different system, root's password locks out whatever was using the old
 * one. Start is the only button that acts on the press, because starting a stopped machine is
 * the one act on this card with nothing to lose.
 *
 * What the presses do here: they move this page's idea of the machine, and say so. There is no
 * hypervisor behind a prototype, and the honest thing a button can report is that it was
 * pressed and what it would have asked for. The state is real enough to review the screen with
 * — press stop and watch the first row change hands — and it is not claiming a round trip.
 */
export function ServerControls({ svc, onDone }: { svc: Service; onDone: (message: string) => void }) {
  const { t } = useLocale();
  const [power, setPower] = useState<Power>('running');
  const [flow, setFlow] = useState<Flow | null>(null);
  const [image, setImage] = useState(IMAGES[0]);
  const [host, setHost] = useState(svc.server);
  const [hostBad, setHostBad] = useState(false);

  const up = power !== 'stopped';
  const close = () => setFlow(null);

  /** Close first, then report: a banner that appears behind a scrim is a banner nobody read. */
  const done = (messageKey: string, next?: Power) => {
    if (next) setPower(next);
    setFlow(null);
    onDone(t(messageKey as never));
  };

  const saveHost = () => {
    const name = host.trim();
    const ok = HOSTNAME.test(name);
    setHostBad(!ok);
    if (!ok) return;
    done('vpsc.hostnameDone');
  };

  return (
    <section className="card">
      <header className="card__head">
        <h2 className="card__heading">
          <IconPower size={17} />
          {t('vpsc.title')}
        </h2>
        <Tag tone={POWER_TONE[power]}>{t(`vpsc.state.${power}` as never)}</Tag>
      </header>

      {/*
        Two groups, each named, rather than nine buttons in one bag. A screen reader meeting
        this card reads "power controls, group" before the first button, which is the
        difference between "Stop what" and "Stop the machine".
      */}
      <div className="ctl" role="group" aria-label={t('vpsc.powerGroup')}>
        <Button size="md" variant="secondary" disabled={up} onClick={() => done('vpsc.startDone', 'running')}>
          {t('vpsc.start')}
        </Button>
        <Button size="md" variant="secondary" disabled={!up} onClick={() => setFlow('stop')}>
          {t('vpsc.stop')}
        </Button>
        <Button size="md" variant="secondary" disabled={!up} onClick={() => setFlow('poweroff')}>
          {t('vpsc.powerOff')}
        </Button>
        <Button size="md" variant="secondary" disabled={!up} onClick={() => setFlow('restart')}>
          {t('vpsc.restart')}
        </Button>
      </div>

      <div className="ctl ctl--wrap" role="group" aria-label={t('vpsc.manageGroup')}>
        <Button size="md" variant="quiet" onClick={() => setFlow('reinstall')}>
          {t('vpsc.reinstall')}
        </Button>
        <Button size="md" variant="quiet" disabled={!up} onClick={() => setFlow('vnc')}>
          {t('vpsc.vnc')}
        </Button>
        <Button size="md" variant="quiet" onClick={() => setFlow('rootpw')}>
          {t('vpsc.rootPw')}
        </Button>
        <Button size="md" variant="quiet" onClick={() => setFlow('hostname')}>
          {t('vpsc.hostname')}
        </Button>
        <Button size="md" variant="quiet" onClick={() => setFlow('rescue')}>
          {t('vpsc.rescue')}
        </Button>
      </div>

      {/* ── stop: the polite one. The machine is asked, and gets to finish. ─────────────── */}
      <Modal
        open={flow === 'stop'}
        onClose={close}
        title={t('vpsc.stopTitle')}
        lede={t('vpsc.stopLede')}
        footer={
          <>
            <Button size="md" variant="primary" onClick={() => done('vpsc.stopDone', 'stopped')}>
              {t('vpsc.stop')}
            </Button>
            <Button size="md" variant="quiet" onClick={close}>
              {t('action.cancel')}
            </Button>
          </>
        }
      />

      {/* ── power off: the same outcome by a worse road, so it says which road. ─────────── */}
      <Modal
        open={flow === 'poweroff'}
        onClose={close}
        title={t('vpsc.powerOffTitle')}
        lede={t('vpsc.powerOffLede')}
        footer={
          <>
            <Button size="md" variant="danger" onClick={() => done('vpsc.powerOffDone', 'stopped')}>
              {t('vpsc.powerOff')}
            </Button>
            <Button size="md" variant="quiet" onClick={close}>
              {t('action.cancel')}
            </Button>
          </>
        }
      >
        <Banner severity="warning" title={t('vpsc.powerOffWarn')}>
          {t('vpsc.powerOffWarnNote')}
        </Banner>
      </Modal>

      {/* ── restart ────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={flow === 'restart'}
        onClose={close}
        title={t('vpsc.restartTitle')}
        lede={t('vpsc.restartLede')}
        footer={
          <>
            <Button size="md" variant="primary" onClick={() => done('vpsc.restartDone', 'running')}>
              {t('vpsc.restart')}
            </Button>
            <Button size="md" variant="quiet" onClick={close}>
              {t('action.cancel')}
            </Button>
          </>
        }
      />

      {/* ── reinstall: the only act here that cannot be undone by doing it again. ───────── */}
      <Modal
        open={flow === 'reinstall'}
        onClose={close}
        title={t('vpsc.reinstallTitle')}
        lede={t('vpsc.reinstallLede')}
        size="md"
        footer={
          <>
            <Button size="md" variant="danger" onClick={() => done('vpsc.reinstallDone', 'running')}>
              {t('vpsc.reinstallGo')}
            </Button>
            <Button size="md" variant="quiet" onClick={close}>
              {t('action.cancel')}
            </Button>
          </>
        }
      >
        <Banner severity="danger" title={t('vpsc.reinstallWarn')}>
          {t('vpsc.reinstallWarnNote')}
        </Banner>
        <label className="field-label u-mt-16">
          <span className="eyebrow">{t('vpsc.image')}</span>
          <Select value={image} onChange={(e) => setImage(e.target.value)}>
            {IMAGES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </label>
        <DevNote>{t('dev.vpsImages')}</DevNote>
      </Modal>

      {/* ── VNC: a console this prototype cannot open, saying so where it would open. ───── */}
      <Modal
        open={flow === 'vnc'}
        onClose={close}
        title={t('vpsc.vncTitle')}
        lede={t('vpsc.vncLede')}
        size="md"
        footer={
          <Button size="md" variant="quiet" onClick={close}>
            {t('action.close')}
          </Button>
        }
      >
        <dl className="kv">
          <div>
            <dt>{t('svc.hostname')}</dt>
            <dd className="serial">
              <bdi>{svc.server}</bdi>
            </dd>
          </div>
          <div>
            <dt>{t('svc.ip')}</dt>
            <dd className="serial">
              <bdi>{svc.ip}</bdi>
            </dd>
          </div>
        </dl>
        <DevNote>{t('dev.vpsVnc')}</DevNote>
      </Modal>

      {/* ── root password ──────────────────────────────────────────────────────────────── */}
      <Modal
        open={flow === 'rootpw'}
        onClose={close}
        title={t('vpsc.rootPwTitle')}
        lede={t('vpsc.rootPwLede')}
        size="md"
        footer={
          <>
            <Button size="md" variant="danger" onClick={() => done('vpsc.rootPwDone')}>
              {t('vpsc.rootPwGo')}
            </Button>
            <Button size="md" variant="quiet" onClick={close}>
              {t('action.cancel')}
            </Button>
          </>
        }
      >
        <Banner severity="warning" title={t('vpsc.rootPwWarn')}>
          {t('vpsc.rootPwWarnNote')}
        </Banner>
        <DevNote>{t('dev.vpsRootPw')}</DevNote>
      </Modal>

      {/* ── hostname: the one dialog that carries a field, so it carries a rule too. ────── */}
      <Modal
        open={flow === 'hostname'}
        onClose={close}
        title={t('vpsc.hostnameTitle')}
        lede={t('vpsc.hostnameLede')}
        size="md"
        footer={
          <>
            <Button size="md" variant="primary" onClick={saveHost}>
              {t('action.save')}
            </Button>
            <Button size="md" variant="quiet" onClick={close}>
              {t('action.cancel')}
            </Button>
          </>
        }
      >
        <label className="field-label">
          <span className="eyebrow">{t('svc.hostname')}</span>
          <input
            className="field serial"
            dir="ltr"
            value={host}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={hostBad || undefined}
            aria-describedby={hostBad ? 'vpsc-host-err' : undefined}
            onChange={(e) => {
              setHost(e.target.value);
              if (hostBad) setHostBad(false);
            }}
          />
        </label>
        {hostBad && (
          <p className="hint hint--bad" id="vpsc-host-err" role="alert">
            {t('vpsc.hostnameBad')}
          </p>
        )}
      </Modal>

      {/* ── rescue ─────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={flow === 'rescue'}
        onClose={close}
        title={t('vpsc.rescueTitle')}
        lede={t('vpsc.rescueLede')}
        size="md"
        footer={
          <>
            <Button size="md" variant="primary" onClick={() => done('vpsc.rescueDone', 'rescue')}>
              {t('vpsc.rescueGo')}
            </Button>
            <Button size="md" variant="quiet" onClick={close}>
              {t('action.cancel')}
            </Button>
          </>
        }
      >
        <Banner severity="info" title={t('vpsc.rescueWarn')}>
          {t('vpsc.rescueWarnNote')}
        </Banner>
      </Modal>
    </section>
  );
}
