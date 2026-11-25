import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../store/AppContext';
import { Users, Phone, FileText, Coffee, Route, Clock3, Download, FileDown, ShieldCheck, Thermometer, Apple, Headphones, AlertTriangle } from 'lucide-react';
import { RiskBadge, Meter, Spinner, Empty } from '../components/ui';
import { fmtDate, toCsv, download } from '../utils/format';
import { downloadDriverPdf } from '../utils/pdf';

const fatigueTips = [
  {
    icon: Clock3,
    title: 'Programa pausas cada 2 horas o 200 km',
    description: 'Detente en un lugar autorizado, camina un poco y estira las piernas. Hazlo antes si notas cansancio.'
  },
  {
    icon: Coffee,
    title: 'Café y siesta breve',
    description: 'Ya estacionado en un lugar seguro, una bebida con cafeína (si es adecuada para ti) y una siesta de unos 20 minutos pueden ayudar temporalmente. No reemplazan dormir lo suficiente.'
  },
  {
    icon: Thermometer,
    title: 'Mantén un ambiente cómodo',
    description: 'Ventila el vehículo y evita el calor excesivo. El aire fresco puede mejorar la comodidad, pero no evita ni corrige el microsueño.'
  },
  {
    icon: Apple,
    title: 'Usa snacks solo como apoyo',
    description: 'Fruta, frutos secos o chicle pueden ser un estímulo momentáneo; masticar no recupera el sueño ni hace seguro seguir conduciendo con somnolencia.'
  },
  {
    icon: Headphones,
    title: 'Conversación o audio, sin distracciones',
    description: 'Hablar con un acompañante o escuchar un pódcast puede variar la rutina, pero no previene la fatiga. No manipules el teléfono mientras conduces.'
  }
];

export default function Conductores() {
  const { pushToast, user } = useApp();
  const [drivers, setDrivers] = useState([]);
  const [detail, setDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);

  useEffect(() => {
    api.drivers().then((d) => setDrivers(d.drivers)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!detail) return;
    setDetailData(null);
    api.driver(detail.id).then((d) => setDetailData(d)).catch(() => {});
  }, [detail]);

  useEffect(() => {
    const id = setInterval(() => {
      api.drivers().then((d) => setDrivers(d.drivers)).catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const exportCsv = () => {
    download('smartroad-conductores.csv', toCsv(drivers, [
      { label: 'nombre', key: 'nombre' },
      { label: 'documento', key: 'documento' },
      { label: 'telefono', key: 'telefono' },
      { label: 'licencia', key: 'licencia' },
      { label: 'empresa', key: 'empresa' },
      { label: 'jornada_horas', key: 'jornada_horas' },
      { label: 'ultimo_descanso', key: 'ultimo_descanso' },
      { label: 'kilometros', key: 'kilometros' },
      { label: 'fatiga_actual', key: 'fatiga_actual' },
      { label: 'riesgo', key: 'riesgo' },
      { label: 'vehiculo', get: (r) => r.vehiculo?.codigo || 'Sin asignar' }
    ]));
  };

  const exportPdf = async () => {
    if (!detailData?.driver) return;
    const driver = detailData.driver;
    const vehicle = detailData.vehicle || detail.vehiculo;
    const events = detailData.fatiga || [];
    try {
      await downloadDriverPdf({
        driver,
        email: driver.email,
        vehicle,
        events,
        filename: `smartroad-${driver.documento}.pdf`
      });
      pushToast('PDF descargado correctamente', 'success');
    } catch (error) {
      pushToast(error.message, 'critical');
    }
  };

  const verifyDriver = async (status) => {
    try {
      const { driver } = await api.verifyDriver(detail.id, status);
      setDetail(driver);
      setDetailData((current) => ({ ...current, driver }));
      setDrivers((current) => current.map((item) => item.id === driver.id ? { ...item, verificacion_estado: status } : item));
      pushToast(status === 'VERIFICADO' ? 'Conductor verificado correctamente' : 'Estado de verificación actualizado', 'success');
    } catch (error) {
      pushToast(error.message, 'warning');
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-5 sm:p-6">
        <div className="mb-4">
          <p className="section-title">Consejos para prevenir la fatiga en la vía</p>
          <p className="mt-1 text-xs text-muted">Hábitos de apoyo para el viaje; ante somnolencia, la prioridad es detenerse de forma segura y descansar.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {fatigueTips.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-xl border border-border-soft bg-surface-2 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-text">
                <Icon size={16} className="shrink-0 text-info" /> {title}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">{description}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs font-semibold leading-relaxed text-danger-bright">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          Si aparecen señales de microsueño o peligro, no intentes combatirlas con café, comida, ventanas abiertas o música: busca una parada segura y descansa antes de continuar.
        </p>
      </section>

      <div className="card overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <p className="section-title">Seguimiento del estado de cada conductor (RF10)</p>
          {drivers.length > 0 && (
            <button onClick={exportCsv} className="btn-ghost text-xs">
              <Download size={14} /> Exportar CSV
            </button>
          )}
        </div>
        {drivers.length === 0 ? (
          <Empty />
        ) : (
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th>Conductor</th>
                <th>Documento</th>
                <th>Vehículo asignado</th>
                <th>Jornada</th>
                <th>Último descanso</th>
                <th>Kilómetros</th>
                <th>Índice de fatiga</th>
                <th>Riesgo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full border ${d.fatiga_actual >= 80 ? 'border-danger/50 bg-danger/15 text-danger-bright' : d.fatiga_actual >= 50 ? 'border-warning/50 bg-warning/10 text-warning' : 'border-success/40 bg-success/10 text-success'}`}>
                        <Users size={16} />
                      </span>
                      <div>
                        <p className="text-xs font-bold">{d.nombre}</p>
                        <p className="text-[10px] text-faint">{d.empresa}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-[11px] text-muted">{d.documento}</td>
                  <td>
                    <p className="text-xs font-bold">{d.vehiculo?.codigo || 'Sin asignar'}</p>
                    <p className="text-[10px] text-faint">{d.vehiculo?.riesgo ? `riesgo ${d.vehiculo.riesgo}` : '—'}</p>
                  </td>
                  <td className="text-xs tabular">{d.jornada_horas} h</td>
                  <td className="text-xs text-muted">{d.ultimo_descanso}</td>
                  <td className="text-xs tabular">{d.kilometros} km</td>
                  <td>
                    <div className="w-40"><Meter value={d.fatiga_actual} label="" /></div>
                  </td>
                  <td><RiskBadge riesgo={d.riesgo} small /></td>
                  <td>
                    <button onClick={() => setDetail(d)} className="text-[11px] font-bold text-info hover:underline">
                      Detalle →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="card w-full max-w-2xl p-6 animate-rise" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${detail.fatiga_actual >= 80 ? 'border-danger/50 bg-danger/15 text-danger-bright' : 'border-success/40 bg-success/10 text-success'}`}>
                  <Users size={26} />
                </span>
                <div>
                  <p className="text-lg font-black">{detail.nombre}</p>
                  <p className="flex items-center gap-2 text-xs text-muted">
                    <Phone size={12} /> {detail.telefono} · <FileText size={12} /> Licencia {detail.licencia}
                  </p>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="text-faint hover:text-text">✕</button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border-soft bg-surface-2 p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-faint"><Clock3 size={12} /> Jornada actual</p>
                <p className="mt-1 text-2xl font-black tabular">{detailData && detailData.driver ? detailData.driver.jornada_horas : detail.jornada_horas} h</p>
              </div>
              <div className="rounded-xl border border-border-soft bg-surface-2 p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-faint"><Coffee size={12} /> Último descanso</p>
                <p className="mt-1 text-2xl font-black tabular">{detail.ultimo_descanso}</p>
              </div>
              <div className="rounded-xl border border-border-soft bg-surface-2 p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-faint"><Route size={12} /> Kilómetros recorridos</p>
                <p className="mt-1 text-2xl font-black tabular">{detail.kilometros} km</p>
              </div>
              <div className="rounded-xl border border-border-soft bg-surface-2 p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-faint">Vehículo</p>
                <p className="mt-1 text-2xl font-black">{detail.vehiculo?.codigo || '—'}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border-soft bg-surface-2 p-4">
              <p className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-faint">
                Índice de fatiga en tiempo real
                <RiskBadge riesgo={detail.riesgo} small />
              </p>
              <Meter value={detail.fatiga_actual} label="Fatiga ponderada (PERCLOS, bostezos, inclinación)" />
              <p className="mt-3 text-[11px] text-faint">
                {detail.fatiga_actual >= 80
                  ? 'El sistema sugiere detener de inmediato y realizar una pausa (RF9). Posible activación de SOS (RF4).'
                  : detail.fatiga_actual >= 50
                    ? 'Riesgo medio: el sistema sugiere una pausa preventiva (RF9).'
                    : 'Conductor en condición normal de alerta.'}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-[11px] text-muted">
                Eventos registrados: <span className="font-bold text-text tabular">{detailData?.fatiga?.length || 0}</span>
              </div>
              {user?.rol === 'admin' && detail.verificacion_estado === 'PENDIENTE' && <button onClick={() => verifyDriver('VERIFICADO')} className="btn-primary text-xs"><ShieldCheck size={14} /> Validar documentos</button>}
              {detailData?.driver && <button onClick={exportPdf} className="btn-primary ml-auto text-xs"><FileDown size={14} /> Generar PDF</button>}
              {detailData?.fatiga?.slice(0, 5).map((e) => (
                <span key={e.id} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-[10px] text-muted">
                  {e.tipo?.replaceAll('_', ' ')} · {fmtDate(e.timestamp)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      {!drivers.length && <Spinner label="Cargando conductores…" />}
    </div>
  );
}
