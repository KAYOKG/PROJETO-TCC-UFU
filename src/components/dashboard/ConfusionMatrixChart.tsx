import { Grid3X3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchConfusionMatrix } from '../../services/api';

interface CM {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

interface ConfusionData {
  ml: CM;
  rules: CM;
  testSize: number;
}

function MatrixGrid({ cm, total, label }: { cm: CM; total: number; label: string }) {
  const cells = [
    { value: cm.tn, pct: cm.tn / total, label: 'TN', good: true },
    { value: cm.fp, pct: cm.fp / total, label: 'FP', good: false },
    { value: cm.fn, pct: cm.fn / total, label: 'FN', good: false },
    { value: cm.tp, pct: cm.tp / total, label: 'TP', good: true },
  ];

  function cellColor(pct: number, good: boolean): string {
    if (good) {
      if (pct > 0.4) return 'bg-green-600 text-white';
      if (pct > 0.2) return 'bg-green-400 text-white';
      if (pct > 0.1) return 'bg-green-200 text-green-900';
      return 'bg-green-50 text-green-800';
    }
    if (pct > 0.15) return 'bg-red-500 text-white';
    if (pct > 0.08) return 'bg-red-300 text-white';
    if (pct > 0.03) return 'bg-red-100 text-red-900';
    return 'bg-red-50 text-red-700';
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">{label}</h4>
      <div className="flex">
        {/* Y-axis label */}
        <div className="flex flex-col justify-center mr-2">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 text-center">
            Real
          </span>
        </div>

        <div className="flex-1">
          {/* Column headers */}
          <div className="grid grid-cols-[80px_1fr_1fr] gap-1 mb-1">
            <div />
            <div className="text-center text-[11px] font-semibold text-gray-500">Normal</div>
            <div className="text-center text-[11px] font-semibold text-gray-500">Suspeito</div>
          </div>

          {/* Row 1: Real Normal */}
          <div className="grid grid-cols-[80px_1fr_1fr] gap-1 mb-1">
            <div className="flex items-center justify-end pr-2">
              <span className="text-[11px] font-semibold text-gray-500">Normal</span>
            </div>
            {cells.slice(0, 2).map((cell) => (
              <div
                key={cell.label}
                className={`rounded-lg p-3 text-center transition-colors ${cellColor(cell.pct, cell.good)}`}
              >
                <div className="text-xl font-bold">{cell.value}</div>
                <div className="text-[10px] opacity-80">{(cell.pct * 100).toFixed(1)}%</div>
                <div className="text-[9px] opacity-60 mt-0.5">{cell.label}</div>
              </div>
            ))}
          </div>

          {/* Row 2: Real Suspeito */}
          <div className="grid grid-cols-[80px_1fr_1fr] gap-1">
            <div className="flex items-center justify-end pr-2">
              <span className="text-[11px] font-semibold text-gray-500">Suspeito</span>
            </div>
            {cells.slice(2, 4).map((cell) => (
              <div
                key={cell.label}
                className={`rounded-lg p-3 text-center transition-colors ${cellColor(cell.pct, cell.good)}`}
              >
                <div className="text-xl font-bold">{cell.value}</div>
                <div className="text-[10px] opacity-80">{(cell.pct * 100).toFixed(1)}%</div>
                <div className="text-[9px] opacity-60 mt-0.5">{cell.label}</div>
              </div>
            ))}
          </div>

          {/* X-axis label */}
          <div className="text-center mt-2">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              Previsto
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfusionMatrixChart() {
  const [data, setData] = useState<ConfusionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfusionMatrix()
      .then(setData)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-400 text-center py-8">Carregando matriz de confusão...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Grid3X3 className="h-5 w-5 text-rose-500" />
          Matriz de Confusão
        </h3>
        <p className="text-gray-400 text-center py-8">
          Execute o treinamento do modelo para ver a matriz de confusão
        </p>
      </div>
    );
  }

  const mlTotal = data.ml.tp + data.ml.fp + data.ml.tn + data.ml.fn;
  const rulesTotal = data.rules.tp + data.rules.fp + data.rules.tn + data.rules.fn;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
        <Grid3X3 className="h-5 w-5 text-rose-500" />
        Matriz de Confusão
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Conjunto de teste: {data.testSize} amostras | Verde = classificação correta | Vermelho = erro
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MatrixGrid cm={data.ml} total={mlTotal} label="Modelo ML (TensorFlow.js)" />
        <MatrixGrid cm={data.rules} total={rulesTotal} label="Baseline de Regras Estáticas" />
      </div>

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-gray-50 rounded p-2 text-center">
          <span className="font-semibold text-gray-700">TN</span>
          <span className="text-gray-500"> = Verdadeiro Negativo</span>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <span className="font-semibold text-gray-700">TP</span>
          <span className="text-gray-500"> = Verdadeiro Positivo</span>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <span className="font-semibold text-gray-700">FP</span>
          <span className="text-gray-500"> = Falso Positivo</span>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <span className="font-semibold text-gray-700">FN</span>
          <span className="text-gray-500"> = Falso Negativo</span>
        </div>
      </div>
    </div>
  );
}
