'use client';

import { useState, useMemo, useRef } from 'react';
import { FloodEvent } from '@/types/event';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, PieChart, Pie, Cell
} from 'recharts';
import html2canvas from 'html2canvas';

interface PlotConfig {
  id: string;
  title: string;
  plotType: 'line' | 'bar' | 'scatter' | 'area' | 'composed' | 'pie';
  xAxis: string;
  yAxis: string;
  aggregation: 'none' | 'sum' | 'avg' | 'count' | 'min' | 'max';
  groupBy?: string;
  dateRange?: { start: string; end: string };
  locationFilter?: string;
  color: string;
}

interface PlotBuilderProps {
  events: FloodEvent[];
}

const AXIS_OPTIONS = [
  { value: 'event_date', label: 'Event Date', type: 'date' },
  { value: 'year', label: 'Year', type: 'temporal' },
  { value: 'month', label: 'Month', type: 'temporal' },
  { value: 'location', label: 'Location', type: 'categorical' },
  { value: 'flood_type', label: 'Flood Type', type: 'categorical' },
  { value: 'rainfall_mm', label: 'Rainfall (mm)', type: 'numerical' },
  { value: 'total_affected', label: 'People Affected', type: 'numerical' },
];

const PLOT_TYPES = [
  { value: 'line', label: 'Line Chart', icon: '📈' },
  { value: 'bar', label: 'Bar Chart', icon: '📊' },
  { value: 'area', label: 'Area Chart', icon: '🌊' },
  { value: 'scatter', label: 'Scatter Plot', icon: '⚫' },
  { value: 'pie', label: 'Pie Chart', icon: '🥧' },
];

const COLORS = ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PlotBuilder({ events }: PlotBuilderProps) {
  const [plots, setPlots] = useState<PlotConfig[]>([
    {
      id: '1',
      title: 'Rainfall Over Time',
      plotType: 'line',
      xAxis: 'event_date',
      yAxis: 'rainfall_mm',
      aggregation: 'avg',
      groupBy: 'month',
      color: COLORS[0],
    }
  ]);
  const [selectedPlotId, setSelectedPlotId] = useState('1');
  const chartRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const selectedPlot = plots.find(p => p.id === selectedPlotId) || plots[0];

  // Helper function to safely calculate aggregated values
  const calculateAggregation = (values: number[], aggregation: string): number => {
    if (values.length === 0) return 0;

    switch (aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      default:
        return values[values.length - 1] || 0;
    }
  };

  // Export chart as PNG
  const exportChart = async (plotId: string) => {
    const chartElement = chartRefs.current[plotId];
    if (!chartElement) return;

    const plot = plots.find(p => p.id === plotId);
    if (!plot) return;

    try {
      // Wait a bit for fonts to load
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: chartElement.scrollWidth,
        height: chartElement.scrollHeight,
        windowWidth: chartElement.scrollWidth,
        windowHeight: chartElement.scrollHeight,
      });

      const link = document.createElement('a');
      link.download = `${plot.title.replace(/[^a-z0-9\s]/gi, '_').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('Error exporting chart:', error);
    }
  };

  // Process data based on plot configuration
  const processedData = useMemo(() => {
    return plots.map(plot => {
      let filteredEvents = [...events];

      // Apply filters
      if (plot.dateRange?.start) {
        filteredEvents = filteredEvents.filter(e => e.event_date >= plot.dateRange!.start);
      }
      if (plot.dateRange?.end) {
        filteredEvents = filteredEvents.filter(e => e.event_date <= plot.dateRange!.end);
      }
      if (plot.locationFilter) {
        filteredEvents = filteredEvents.filter(e =>
          e.location?.toLowerCase().includes(plot.locationFilter!.toLowerCase())
        );
      }

      // Extract and transform data
      let data: any[] = [];

      if (plot.plotType === 'pie') {
        // For pie charts, group by categorical variable
        const groupKey = plot.xAxis === 'location' ? 'location' : 'flood_type';
        const grouped = filteredEvents.reduce((acc: any, event: any) => {
          const key = event[groupKey] || 'Unknown';
          if (!acc[key]) acc[key] = 0;
          acc[key]++;
          return acc;
        }, {});

        data = Object.entries(grouped).map(([name, value]) => ({
          name,
          value,
        }));
      } else if (plot.groupBy === 'year') {
        const grouped = filteredEvents.reduce((acc: any, event) => {
          if (!event.event_date) return acc;
          const year = new Date(event.event_date).getFullYear();
          if (!acc[year]) {
            acc[year] = { year, values: [], count: 0 };
          }
          const yValue = event[plot.yAxis as keyof FloodEvent];
          if (yValue !== null && yValue !== undefined) {
            acc[year].values.push(Number(yValue));
            acc[year].count++;
          }
          return acc;
        }, {});

        data = Object.values(grouped).map((g: any) => ({
          name: g.year.toString(),
          value: calculateAggregation(g.values, plot.aggregation),
        })).sort((a, b) => Number(a.name) - Number(b.name));
      } else if (plot.groupBy === 'month') {
        const grouped = filteredEvents.reduce((acc: any, event) => {
          if (!event.event_date) return acc;
          const date = new Date(event.event_date);
          const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!acc[yearMonth]) {
            acc[yearMonth] = { yearMonth, values: [], count: 0 };
          }
          const yValue = event[plot.yAxis as keyof FloodEvent];
          if (yValue !== null && yValue !== undefined) {
            acc[yearMonth].values.push(Number(yValue));
            acc[yearMonth].count++;
          }
          return acc;
        }, {});

        data = Object.values(grouped).map((g: any) => ({
          name: g.yearMonth,
          value: calculateAggregation(g.values, plot.aggregation),
        })).sort((a, b) => a.name.localeCompare(b.name));
      } else if (plot.xAxis === 'location' || plot.xAxis === 'flood_type') {
        const grouped = filteredEvents.reduce((acc: any, event: any) => {
          const key = event[plot.xAxis] || 'Unknown';
          if (!acc[key]) {
            acc[key] = { name: key, values: [], count: 0 };
          }
          const yValue = event[plot.yAxis as keyof FloodEvent];
          if (yValue !== null && yValue !== undefined) {
            acc[key].values.push(Number(yValue));
            acc[key].count++;
          }
          return acc;
        }, {});

        data = Object.values(grouped).map((g: any) => ({
          name: g.name,
          value: calculateAggregation(g.values, plot.aggregation),
        }));
      } else {
        // Raw data for scatter plots or no grouping
        data = filteredEvents
          .filter(e => {
            const xVal = e[plot.xAxis as keyof FloodEvent];
            const yVal = e[plot.yAxis as keyof FloodEvent];
            return xVal !== null && xVal !== undefined && yVal !== null && yVal !== undefined;
          })
          .map(e => ({
            name: plot.xAxis === 'event_date' ? new Date(e.event_date).toLocaleDateString() : e[plot.xAxis as keyof FloodEvent],
            value: Number(e[plot.yAxis as keyof FloodEvent]),
            x: plot.xAxis === 'event_date' ? new Date(e.event_date).getTime() : Number(e[plot.xAxis as keyof FloodEvent]),
            y: Number(e[plot.yAxis as keyof FloodEvent]),
          }))
          .sort((a, b) => {
            if (typeof a.name === 'string' && typeof b.name === 'string') {
              return a.name.localeCompare(b.name);
            }
            return Number(a.name) - Number(b.name);
          });
      }

      // Filter out any NaN or invalid values
      data = data.filter(item => {
        const value = typeof item.value === 'number' ? item.value : (item.y || 0);
        return !isNaN(value) && isFinite(value);
      });

      return { plotId: plot.id, data };
    });
  }, [plots, events]);

  const updatePlot = (updates: Partial<PlotConfig>) => {
    setPlots(plots.map(p => p.id === selectedPlotId ? { ...p, ...updates } : p));
  };

  const addNewPlot = () => {
    const newId = (Math.max(...plots.map(p => parseInt(p.id))) + 1).toString();
    const newPlot: PlotConfig = {
      id: newId,
      title: `Plot ${newId}`,
      plotType: 'line',
      xAxis: 'event_date',
      yAxis: 'rainfall_mm',
      aggregation: 'avg',
      groupBy: 'month',
      color: COLORS[plots.length % COLORS.length],
    };
    setPlots([...plots, newPlot]);
    setSelectedPlotId(newId);
  };

  const deletePlot = (id: string) => {
    if (plots.length === 1) return;
    const newPlots = plots.filter(p => p.id !== id);
    setPlots(newPlots);
    if (selectedPlotId === id) {
      setSelectedPlotId(newPlots[0].id);
    }
  };

  const renderChart = (plot: PlotConfig, data: any[]) => {
    const chartData = processedData.find(p => p.plotId === plot.id)?.data || [];

    if (chartData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">No data available for this configuration</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 },
    };

    switch (plot.plotType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis
                dataKey="name"
                stroke="var(--text-secondary)"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={plot.color}
                strokeWidth={2}
                dot={{ fill: plot.color, r: 4 }}
                activeDot={{ r: 6 }}
                name={plot.title}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis
                dataKey="name"
                stroke="var(--text-secondary)"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="value" fill={plot.color} name={plot.title} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id={`color${plot.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={plot.color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={plot.color} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis
                dataKey="name"
                stroke="var(--text-secondary)"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={plot.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color${plot.id})`}
                name={plot.title}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis
                dataKey="x"
                stroke="var(--text-secondary)"
                type="number"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                dataKey="y"
                stroke="var(--text-secondary)"
                type="number"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px'
                }}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Scatter
                name={plot.title}
                data={chartData}
                fill={plot.color}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                outerRadius={120}
                fill={plot.color}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="card p-6 animate-slide-up">
        <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <svg className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Plot Configuration
        </h3>

        {/* Plot Tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {plots.map((plot) => (
            <div key={plot.id} className="flex items-center gap-1">
              <button
                onClick={() => setSelectedPlotId(plot.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlotId === plot.id ? 'scale-105' : 'hover:scale-105'
                }`}
                style={{
                  background: selectedPlotId === plot.id ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                  color: selectedPlotId === plot.id ? 'white' : 'var(--text-secondary)',
                  border: selectedPlotId === plot.id ? 'none' : '1px solid var(--border-default)',
                }}
              >
                {plot.title}
              </button>
              {plots.length > 1 && (
                <button
                  onClick={() => deletePlot(plot.id)}
                  className="w-8 h-8 rounded-lg hover:bg-red-100 flex items-center justify-center transition-colors"
                  style={{ color: 'var(--danger)' }}
                  title="Delete plot"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addNewPlot}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--accent-primary)',
              border: '2px dashed var(--accent-primary)',
            }}
          >
            + Add Plot
          </button>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Plot Title */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Plot Title
            </label>
            <input
              type="text"
              value={selectedPlot.title}
              onChange={(e) => updatePlot({ title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Plot Type */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Chart Type
            </label>
            <select
              value={selectedPlot.plotType}
              onChange={(e) => updatePlot({ plotType: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              {PLOT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* X Axis */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              X-Axis
            </label>
            <select
              value={selectedPlot.xAxis}
              onChange={(e) => updatePlot({ xAxis: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              {AXIS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Y Axis */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Y-Axis
            </label>
            <select
              value={selectedPlot.yAxis}
              onChange={(e) => updatePlot({ yAxis: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              {AXIS_OPTIONS.filter(opt => opt.type === 'numerical').map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Aggregation */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Aggregation
            </label>
            <select
              value={selectedPlot.aggregation}
              onChange={(e) => updatePlot({ aggregation: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="none">None</option>
              <option value="count">Count</option>
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="min">Minimum</option>
              <option value="max">Maximum</option>
            </select>
          </div>

          {/* Group By */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Group By
            </label>
            <select
              value={selectedPlot.groupBy || 'none'}
              onChange={(e) => updatePlot({ groupBy: e.target.value === 'none' ? undefined : e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="none">None</option>
              <option value="year">Year</option>
              <option value="month">Month</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Date From
            </label>
            <input
              type="date"
              value={selectedPlot.dateRange?.start || ''}
              onChange={(e) => updatePlot({
                dateRange: { ...selectedPlot.dateRange, start: e.target.value } as any
              })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Date Range End */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Date To
            </label>
            <input
              type="date"
              value={selectedPlot.dateRange?.end || ''}
              onChange={(e) => updatePlot({
                dateRange: { ...selectedPlot.dateRange, end: e.target.value } as any
              })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Location Filter
            </label>
            <input
              type="text"
              value={selectedPlot.locationFilter || ''}
              onChange={(e) => updatePlot({ locationFilter: e.target.value })}
              placeholder="e.g., Kukatpally"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Color
            </label>
            <div className="flex gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => updatePlot({ color })}
                  className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                    selectedPlot.color === color ? 'ring-2 ring-offset-2 scale-110' : ''
                  }`}
                  style={{
                    background: color,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Display */}
      <div className={`grid gap-6 ${plots.length === 1 ? 'grid-cols-1' : plots.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {plots.map((plot) => (
          <div key={plot.id} className="card p-6 animate-slide-up" ref={(el) => { chartRefs.current[plot.id] = el; }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
                {plot.title}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full" style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)'
                }}>
                  {PLOT_TYPES.find(t => t.value === plot.plotType)?.label}
                </span>
                <button
                  onClick={() => exportChart(plot.id)}
                  className="p-2 rounded-lg transition-all hover:scale-110"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)'
                  }}
                  title="Download chart as PNG"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </div>
            <div style={{ height: '400px' }}>
              {renderChart(plot, processedData.find(p => p.plotId === plot.id)?.data || [])}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
