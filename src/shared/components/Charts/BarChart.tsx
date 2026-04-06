import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BarChartData {
  name: string;
  [key: string]: string | number;
}

interface BarChartProps {
  data: BarChartData[];
  dataKeys: string[];
  colors?: string[];
  xAxisKey?: string;
  height?: number;
}

function BarChart({
  data,
  dataKeys,
  colors = ['#4f86ff', '#27c7da', '#f5b43c', '#6dc36d', '#c084fc'],
  xAxisKey = 'name',
  height = 300,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index % colors.length]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export default BarChart;

