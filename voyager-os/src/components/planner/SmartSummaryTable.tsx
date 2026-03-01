import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAppStore } from '../../store';
import { AlertTriangle, CheckCircle, Info, Plane, Hotel, Navigation } from 'lucide-react';
import { isTransportCat, isAccommodationCat } from '../../constants';
import { useLocations } from '../../hooks/useTripData';

export const SmartSummaryTable = () => {
  const { setSelectedLocationId } = useAppStore();
  const { data: locations = [] } = useLocations();
  const navigate = useNavigate();

  const handleGoToReserve = (id: number) => {
    navigate('/');
    setTimeout(() => {
      setSelectedLocationId(id);
    }, 100);
  };

  const analytics = useMemo(() => {
    let totalCost = 0;
    const pendingReservations: any[] = [];
    const heuristicAlerts: any[] = [];

    // Financials & Pending Check
    locations.filter(l => l.day !== 'unassigned' && (l.variantId || 'default') === 'default').forEach(loc => {
      // Calculate Price
      if (loc.newPrice?.amount) totalCost += loc.newPrice.amount;
      else if (loc.cost) totalCost += parseFloat(loc.cost) || 0;

      // Pending Reservations Check
      if (loc.priority === 'necessary' && loc.reservationStatus === 'pending') {
        pendingReservations.push(loc);
      }

      // Heuristic 1: Flights without ref
      if ((loc.cat === 'flight-departure' || loc.cat === 'flight-arrival') && !loc.bookingRef && loc.reservationStatus === 'booked') {
        heuristicAlerts.push({ type: 'warn', msg: `Vuelo "${loc.title || loc.notes.split('\n')[0]}" marcado como reservado pero sin PNR/Referencia.` });
      }
    });

    // Cross-Variant Analysis (Example: If hotel in A is cheaper than B)
    const hotels = locations.filter(l => isAccommodationCat(l.cat));
    if (hotels.length > 1) {
      const hA = hotels.find(h => h.variantId === 'default');
      const hB = hotels.find(h => h.variantId !== 'default');
      if (hA && hB) {
        const pA = hA.newPrice?.amount || parseFloat(hA.cost) || 0;
        const pB = hB.newPrice?.amount || parseFloat(hB.cost) || 0;
        const diff = Math.abs(pA - pB);
        if (diff > 0) {
          const cheaper = pA < pB ? 'Ruta Principal' : hB.variantId;
          heuristicAlerts.push({ type: 'info', msg: `El hotel de la ${cheaper} es ${diff.toFixed(0)}€ más barato.` });
        }
      }
    }

    const totalCostObj = locations.filter(l => l.day !== 'unassigned' && (l.variantId || 'default') === 'default').reduce((acc, loc) => {
      const amount = loc.newPrice?.amount || parseFloat(loc.cost) || 0;
      const currency = loc.newPrice?.currency || acc.currency;
      return { amount: acc.amount + amount, currency };
    }, { amount: 0, currency: 'EUR' });

    totalCost = totalCostObj.amount;
    const currencySymbol = totalCostObj.currency === 'USD' ? '$' : totalCostObj.currency === 'GBP' ? '£' : totalCostObj.currency === 'JPY' ? '¥' : '€';

    return { totalCost, currencySymbol, pendingReservations, heuristicAlerts };
  }, [locations]);

  return (
    <div className="flex-1 overflow-y-auto bg-nature-bg p-8 md:p-12 custom-scroll">
      <div className="max-w-5xl mx-auto space-y-12">

        <header>
          <h1 className="text-4xl font-sans text-nature-primary mb-2">Resumen y Análisis</h1>
          <p className="text-gray-500">Motor inteligente de decisiones y finanzas de tu viaje.</p>
        </header>

        {/* Dashboard KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold tracking-widest text-gray-400 uppercase flex items-center gap-2"><CheckCircle size={14} /> Estado Total</span>
            <div className="mt-4">
              <span className="text-4xl font-sans text-nature-primary">{analytics.totalCost.toFixed(2)}</span>
              <span className="text-xl text-gray-400 ml-1">{analytics.currencySymbol}</span>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between ${analytics.pendingReservations.length > 0 ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-green-50 border-green-100 text-green-900'}`}>
            <span className="text-xs font-bold tracking-widest uppercase flex items-center gap-2"><AlertTriangle size={14} /> Pendiente de Reserva</span>
            <div className="mt-4 text-3xl font-sans">
              {analytics.pendingReservations.length} <span className="text-lg opacity-70">vitales</span>
            </div>
          </div>
        </div>

        {/* Actionable Alerts */}
        <section className="space-y-4">
          <h2 className="text-xl font-sans text-nature-primary flex items-center gap-2">
            <Info size={18} /> Alertas de Transporte
          </h2>
          <div className="grid gap-3">
            {analytics.heuristicAlerts.length === 0 && <p className="text-gray-400 text-sm">Todo parece estar en orden.</p>}

            {analytics.heuristicAlerts.map((alt, i) => (
              <div key={i} className={`p-4 rounded-xl flex items-start gap-3 border ${alt.type === 'warn' ? 'bg-amber-50/50 border-amber-100' : 'bg-blue-50/50 border-blue-100'}`}>
                {alt.type === 'warn' ? <AlertTriangle size={16} className="text-amber-500 mt-0.5" /> : <Info size={16} className="text-blue-500 mt-0.5" />}
                <p className="text-sm font-medium text-nature-text">{alt.msg}</p>
              </div>
            ))}

            {analytics.pendingReservations.map(p => (
              <div key={p.id} className="p-4 rounded-xl flex items-center justify-between border bg-red-50/30 border-red-100 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                    {isTransportCat(p.cat) ? <Plane size={14} /> : isAccommodationCat(p.cat) ? <Hotel size={14} /> : <Navigation size={14} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-900">Urgente: {p.title || p.notes.split('\n')[0] || p.cat}</h4>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-red-400 mt-0.5">{p.day} • {p.slot || 'S/H'}</p>
                  </div>
                </div>
                <button onClick={() => handleGoToReserve(p.id)} className="text-xs bg-red-500 text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-red-600 active:scale-95 transition-all">
                  Ir a Reservar
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};
