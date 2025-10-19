import React, { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";
import styles from "./ChatWindow.module.css";

const DEFAULT_THEME = {
    backgroundColor: "transparent",
    textStyle: {
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#1f2933",
    },
    color: [
        "#4f46e5",
        "#0ea5e9",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
    ],
};

const normalizeMetricsArray = (data = {}) => {
    const sparks = Array.isArray(data?.metrics?.spark)
        ? data.metrics.spark
        : [];
    const bars = Array.isArray(data?.metrics?.bars)
        ? data.metrics.bars
        : [];

    return {
        spark: sparks,
        bars,
    };
};

const createBarOption = (title, metrics, max = 30) => {
    const categories = ["学术价值", "创新性", "可行性", "团队", "影响"];
    const values = metrics.bars.length === categories.length
        ? metrics.bars
        : categories.map((_, idx) => metrics.bars[idx] ?? 0);

    return {
        ...DEFAULT_THEME,
        title: {
            text: title,
            left: "center",
            textStyle: {
                fontSize: 14,
                fontWeight: 600,
            },
        },
        tooltip: {
            trigger: "axis",
        },
        grid: {
            top: 48,
            left: 24,
            right: 24,
            bottom: 24,
        },
        xAxis: {
            type: "value",
            max,
            splitLine: {
                lineStyle: {
                    type: "dashed",
                    color: "#e5e7eb",
                },
            },
        },
        yAxis: {
            type: "category",
            data: categories,
            axisLabel: {
                color: "#4b5563",
                fontSize: 12,
            },
        },
        series: [
            {
                type: "bar",
                data: values,
                barWidth: 16,
                itemStyle: {
                    borderRadius: [4, 4, 4, 4],
                },
                label: {
                    show: true,
                    position: "right",
                    color: "#1f2937",
                    fontWeight: 500,
                },
            },
        ],
    };
};

const createRadarOption = (title, radarMetrics) => {
    const entries = Object.entries(radarMetrics || {});

    if (entries.length === 0) {
        return null;
    }

    return {
        ...DEFAULT_THEME,
        title: {
            text: `${title} - 综合雷达`,
            left: "center",
            textStyle: {
                fontSize: 14,
                fontWeight: 600,
            },
        },
        tooltip: {},
        radar: {
            indicator: entries.map(([key]) => ({ name: key, max: 1 })),
            splitArea: {
                areaStyle: {
                    color: ["rgba(79,70,229,0.04)", "rgba(79,70,229,0.02)"]
                }
            },
            axisName: {
                color: "#4b5563",
                fontSize: 12,
            },
        },
        series: [
            {
                type: "radar",
                data: [
                    {
                        value: entries.map(([, value]) => value ?? 0),
                        areaStyle: {
                            color: "rgba(79, 70, 229, 0.25)",
                        },
                        lineStyle: {
                            color: "#4f46e5",
                            width: 2,
                        },
                        symbol: "circle",
                        symbolSize: 6,
                    },
                ],
            },
        ],
    };
};

const ChartBlock = ({ data, rawJson }) => {
    const { columns = [], ui_hints: uiHints = {} } = data || {};

    const chartConfigs = useMemo(() => {
        return columns.map((column, index) => {
            const metrics = normalizeMetricsArray(column);
            const barOption = createBarOption(
                column.title || `方案 ${index + 1}`,
                metrics,
                uiHints.bars_max || uiHints.spark_max || 100
            );
            const radarOption = createRadarOption(column.title || `方案 ${index + 1}`, column.radar);

            return {
                id: column.id || `chart-${index}`,
                title: column.title,
                summary: column.summary,
                barOption,
                radarOption,
                tags: Array.isArray(column.tags) ? column.tags : [],
            };
        });
    }, [columns, uiHints]);

    const isRenderable = chartConfigs.some((config) => config.barOption || config.radarOption);

    const containerRefs = useRef([]);

    useEffect(() => {
        const instances = [];

        chartConfigs.forEach((config, index) => {
            const element = containerRefs.current[index];
            if (!element) return;

            const barDom = element.querySelector(`.${styles.chartBar}`);
            const radarDom = element.querySelector(`.${styles.chartRadar}`);

            if (barDom && config.barOption) {
                const chart = echarts.init(barDom);
                chart.setOption(config.barOption);
                instances.push(chart);
            }

            if (radarDom && config.radarOption) {
                const chart = echarts.init(radarDom);
                chart.setOption(config.radarOption);
                instances.push(chart);
            }
        });

        const handleResize = () => {
            instances.forEach((instance) => instance.resize());
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            instances.forEach((instance) => instance.dispose());
        };
    }, [chartConfigs]);

    if (!data || !isRenderable) {
        return (
            <div className={styles.chartFallback}>
                <div>未能解析图表数据</div>
                {rawJson && <pre className={styles.chartRawJson}>{rawJson}</pre>}
            </div>
        );
    }

    return (
        <div className={styles.chartBlockWrapper}>
            {chartConfigs.map((config, index) => (
                <div
                    key={config.id}
                    className={styles.chartCard}
                    ref={(el) => {
                        containerRefs.current[index] = el;
                    }}
                >
                    <div className={styles.chartHeader}>
                        <div className={styles.chartTitle}>{config.title}</div>
                        <div className={styles.chartSummary}>{config.summary}</div>
                        {config.tags.length > 0 && (
                            <div className={styles.chartTags}>
                                {config.tags.map((tag) => (
                                    <span key={tag} className={styles.chartTag}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className={styles.chartContent}>
                        {config.barOption && <div className={styles.chartBar} />}
                        {config.radarOption && <div className={styles.chartRadar} />}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChartBlock;





