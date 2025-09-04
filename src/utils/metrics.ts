interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

class Metrics {
  private send(metric: Metric) {
    // In a real application, you would send this to a metrics service
    // like Prometheus, Grafana, or Datadog.
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      ...metric,
    }));
  }

  increment(name: string, value = 1, tags?: Record<string, string>) {
    this.send({ name, value, tags });
  }

  gauge(name: string, value: number, tags?: Record<string, string>) {
    this.send({ name, value, tags });
  }

  timing(name: string, value: number, tags?: Record<string, string>) {
    this.send({ name, value, tags });
  }
}

export const metrics = new Metrics();