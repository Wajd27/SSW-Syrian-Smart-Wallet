import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface LineChartData {
  name: string;
  [key: string]: string | number;
}

interface LineChartProps {
  data: LineChartData[];
  dataKeys: string[];
  colors?: string[];
  xAxisKey?: string;
  height?: number;
}

function LineChart({
  data,
  dataKeys,
  colors = ['#4f86ff', '#27c7da', '#f5b43c', '#ef4444', '#6dc36d', '#c084fc'],
  xAxisKey = 'name',
  height = 300,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {dataKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

export default LineChart;

