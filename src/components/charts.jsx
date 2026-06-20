import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadialBarChart, RadialBar,
} from 'recharts'

export const PALETTE = ['#0D9488', '#46A8A1', '#0F2A33', '#B45309', '#7CC4BE', '#94A3B8']

const axis = { tick: { fontSize: 11, fill: '#3C5963' }, axisLine: false, tickLine: false }
const grid = <CartesianGrid strokeDasharray="3 6" stroke="#E4EAEA" vertical={false} />
const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: '1px solid #E4EAEA', boxShadow: '0 8px 30px rgba(15,42,51,.12)', fontSize: 12 },
  labelStyle: { fontWeight: 600, color: '#0F2A33' },
}

export const TrendLine = ({ data, lines, height = 220, yDomain }) => (
  <ResponsiveContainer width="100%" height={height}>
    <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
      {grid}
      <XAxis dataKey="x" {...axis} minTickGap={24} />
      <YAxis {...axis} domain={yDomain} />
      <Tooltip {...tooltipStyle} />
      {lines.length > 1 && <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />}
      {lines.map((l, i) => (
        <Line key={l.key} type="monotone" dataKey={l.key} name={l.name || l.key}
          stroke={l.color || PALETTE[i]} strokeWidth={2.2} dot={false} activeDot={{ r: 4 }} />
      ))}
    </LineChart>
  </ResponsiveContainer>
)

export const TrendArea = ({ data, dataKey, color = '#0D9488', height = 200, name }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
      <defs>
        <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {grid}
      <XAxis dataKey="x" {...axis} minTickGap={24} />
      <YAxis {...axis} />
      <Tooltip {...tooltipStyle} />
      <Area type="monotone" dataKey={dataKey} name={name || dataKey} stroke={color} strokeWidth={2.2} fill={`url(#g-${dataKey})`} />
    </AreaChart>
  </ResponsiveContainer>
)

export const Bars = ({ data, bars, height = 220, xKey = 'x', stacked = false }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
      {grid}
      <XAxis dataKey={xKey} {...axis} />
      <YAxis {...axis} />
      <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(13,148,136,.06)' }} />
      {bars.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
      {bars.map((b, i) => (
        <Bar key={b.key} dataKey={b.key} name={b.name || b.key} stackId={stacked ? 's' : undefined}
          fill={b.color || PALETTE[i]} radius={stacked && i < bars.length - 1 ? [0,0,0,0] : [6, 6, 0, 0]} maxBarSize={36} />
      ))}
    </BarChart>
  </ResponsiveContainer>
)

export const Donut = ({ data, height = 220 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} strokeWidth={0}>
        {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
      </Pie>
      <Tooltip {...tooltipStyle} />
      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
    </PieChart>
  </ResponsiveContainer>
)

export const Gauge = ({ value, label, color = '#0D9488', height = 170 }) => (
  <div className="relative">
    <ResponsiveContainer width="100%" height={height}>
      <RadialBarChart innerRadius="72%" outerRadius="100%" startAngle={220} endAngle={-40}
        data={[{ value, fill: color }]}>
        <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#EEF7F6' }} />
      </RadialBarChart>
    </ResponsiveContainer>
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <div className="font-display font-bold text-2xl">{value}%</div>
      {label && <div className="text-xs text-ink-3">{label}</div>}
    </div>
  </div>
)
