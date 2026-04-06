import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface PieChartData {
  name: string;
  value: number;
}

interface PieChartProps {
  data: PieChartData[];
  colors?: string[];
  height?: number;
}

const DEFAULT_COLORS = [
  '#4f86ff',
  '#27c7da',
  '#f5b43c',
  '#6dc36d',
  '#c084fc',
  '#ef4444',
  '#6478ff',
  '#f472b6',
];

function PieChart({
  data,
  colors = DEFAULT_COLORS,
  height = 300,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#4f86ff"
          dataKey="value"
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

export default PieChart;

