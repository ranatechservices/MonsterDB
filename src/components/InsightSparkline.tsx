import React, { useId } from 'react';

interface InsightSparklineProps {
  points: number[];
  secondaryPoints?: number[];
  projectedPoints?: number[];
  projectedSecondaryPoints?: number[];
  referenceLine?: number;
  unit: string;
  severity: 'positive' | 'info' | 'warning' | 'critical';
}

export default function InsightSparkline({
  points,
  secondaryPoints,
  projectedPoints,
  projectedSecondaryPoints,
  referenceLine,
  unit,
  severity
}: InsightSparklineProps) {
  const gradientId = useId();

  if (!points || points.length < 2) {
    return null;
  }

  // Combine all values for min/max computation
  const allValues = [...points];
  if (secondaryPoints && secondaryPoints.length > 0) {
    allValues.push(...secondaryPoints);
  }
  if (projectedPoints && projectedPoints.length > 0) {
    allValues.push(...projectedPoints);
  }
  if (projectedSecondaryPoints && projectedSecondaryPoints.length > 0) {
    allValues.push(...projectedSecondaryPoints);
  }
  if (typeof referenceLine === 'number' && !isNaN(referenceLine)) {
    allValues.push(referenceLine);
  }

  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const range = rawMax - rawMin;

  // Add 10% padding or +/- 1 if flat line
  const padding = range === 0 ? 1 : range * 0.1;
  const yMin = rawMin - padding;
  const yMax = rawMax + padding;
  const yRange = yMax - yMin;

  const width = 200;
  const height = 48;

  const totalPointsCount = points.length + (projectedPoints && projectedPoints.length > 0 ? projectedPoints.length : 0);

  const getY = (val: number) => {
    return height - ((val - yMin) / yRange) * height;
  };

  const getX = (idx: number, total: number) => {
    return (idx / (total - 1)) * width;
  };

  const primaryCoords = points.map((val, idx) => ({
    x: getX(idx, totalPointsCount),
    y: getY(val)
  }));

  const primaryPolyline = primaryCoords.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');

  // Projected continuation lines
  let projectedPolyline = '';
  if (projectedPoints && projectedPoints.length > 0) {
    const lastRealPt = primaryCoords[primaryCoords.length - 1];
    const projCoords = [
      lastRealPt,
      ...projectedPoints.map((val, pIdx) => ({
        x: getX(points.length + pIdx, totalPointsCount),
        y: getY(val)
      }))
    ];
    projectedPolyline = projCoords.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
  }

  // Path for gradient fill (for historical segment)
  const firstPt = primaryCoords[0];
  const lastPt = primaryCoords[primaryCoords.length - 1];
  const areaPath = `M ${firstPt.x.toFixed(1)},${height} L ${primaryCoords
    .map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(' L ')} L ${lastPt.x.toFixed(1)},${height} Z`;

  let secondaryPolyline = '';
  if (secondaryPoints && secondaryPoints.length === points.length) {
    secondaryPolyline = secondaryPoints
      .map((val, idx) => `${getX(idx, totalPointsCount).toFixed(1)},${getY(val).toFixed(1)}`)
      .join(' ');
  }

  let projectedSecondaryPolyline = '';
  if (projectedSecondaryPoints && projectedSecondaryPoints.length > 0 && secondaryPoints && secondaryPoints.length > 0) {
    const lastSecVal = secondaryPoints[secondaryPoints.length - 1];
    const lastSecPt = {
      x: getX(points.length - 1, totalPointsCount),
      y: getY(lastSecVal)
    };
    const projSecCoords = [
      lastSecPt,
      ...projectedSecondaryPoints.map((val, pIdx) => ({
        x: getX(points.length + pIdx, totalPointsCount),
        y: getY(val)
      }))
    ];
    projectedSecondaryPolyline = projSecCoords.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
  }

  const refY = typeof referenceLine === 'number' && !isNaN(referenceLine) ? getY(referenceLine) : null;

  // Colors based on severity matching HealthInsights theme
  const severityColors = {
    critical: {
      stroke: 'stroke-rose-500 dark:stroke-rose-400',
      gradientStop: '#f43f5e'
    },
    warning: {
      stroke: 'stroke-amber-500 dark:stroke-amber-400',
      gradientStop: '#f59e0b'
    },
    positive: {
      stroke: 'stroke-emerald-500 dark:stroke-emerald-400',
      gradientStop: '#10b981'
    },
    info: {
      stroke: 'stroke-blue-500 dark:stroke-blue-400',
      gradientStop: '#3b82f6'
    }
  };

  const currentConfig = severityColors[severity] || severityColors.info;

  return (
    <div className="w-full relative py-1">
      <span className="sr-only">
        Trend: {points.join(', ')} {unit}
      </span>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-12 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={currentConfig.gradientStop} stopOpacity="0.25" />
            <stop offset="100%" stopColor={currentConfig.gradientStop} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Reference Line */}
        {refY !== null && (
          <line
            x1="0"
            y1={refY.toFixed(1)}
            x2={width}
            y2={refY.toFixed(1)}
            className="stroke-slate-300 dark:stroke-slate-600"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {/* Gradient fill area */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Secondary series (e.g. Diastolic BP) */}
        {secondaryPolyline && (
          <polyline
            fill="none"
            points={secondaryPolyline}
            className="stroke-slate-400 dark:stroke-slate-500"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Projected Secondary series */}
        {projectedSecondaryPolyline && (
          <polyline
            fill="none"
            points={projectedSecondaryPolyline}
            className="stroke-slate-400 dark:stroke-slate-500 opacity-60"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="3 3"
          />
        )}

        {/* Primary series (historical) */}
        <polyline
          fill="none"
          points={primaryPolyline}
          className={currentConfig.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Projected Primary series (forecast continuation) */}
        {projectedPolyline && (
          <polyline
            fill="none"
            points={projectedPolyline}
            className={`${currentConfig.stroke} opacity-70`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 3"
          />
        )}
      </svg>
    </div>
  );
}

