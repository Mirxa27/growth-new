interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

class Metrics {
  private send(metric: Metric) {
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