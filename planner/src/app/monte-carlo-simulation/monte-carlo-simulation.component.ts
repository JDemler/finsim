import { Component, Injectable, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface SimulationParams {
  initialInvestment: number;
  monthlyInvestment: number;
  years: number;
  numSimulations: number;
}

interface SimulationResult {
  finalValues: number[];
  meanFinalValue: number;
  percentile5: number;
  percentile95: number;
  paths: number[][];  // For visualization
}

@Component({
  selector: 'app-monte-carlo-simulation',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './monte-carlo-simulation.component.html',
  styleUrl: './monte-carlo-simulation.component.sass'
})
@Injectable({providedIn: 'root'})
export class MonteCarloSimulationComponent {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  // Historical data
  private dailyReturns: number[] = [];
  private muDaily: number = 0;
  private sigmaDaily: number = 0;
  private dataLoaded = false;
  isLoading = false;
  progress = 0;

  // Parameters
  params: SimulationParams = {
    initialInvestment: 10000,
    monthlyInvestment: 500,
    years: 10,
    numSimulations: 1000
  };

  // Results
  result: SimulationResult | null = null;

  // Chart configuration
  lineChartType: ChartType = 'line';
  lineChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => '€' + value
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return '€' + context.parsed.y.toFixed(0);
          }
        }
      }
    }
  };


  constructor(private http: HttpClient) {
    this.loadHistoricalData();
  }

  private async loadHistoricalData() {
    const csvText = await firstValueFrom(
      this.http.get('assets/ftse-all-world.csv', { responseType: 'text' })
    );

    // Parse CSV and calculate daily returns
    const lines = csvText.split('\n').slice(1); // Skip header
    const prices: number[] = [];

    for (const line of lines) {
      // Split by comma but keep content within quotes together
      const columns = line.match(/("([^"]*)")|([^,]+)/g);
      if (columns && columns.length >= 2) {
        // Price is in the second column, remove quotes and parse
        const priceStr = columns[1].replace(/"/g, '');
        const price = parseFloat(priceStr);
        if (!isNaN(price)) {
          prices.push(price);
        }
      }
    }

    // Reverse the array since the CSV has newest dates first
    prices.reverse();

    // Calculate daily returns
    this.dailyReturns = [];
    for (let i = 1; i < prices.length; i++) {
      const r = (prices[i] - prices[i - 1]) / prices[i - 1];
      this.dailyReturns.push(r);
    }

    // Calculate mean and standard deviation
    this.muDaily = this.arrayMean(this.dailyReturns);
    this.sigmaDaily = this.arrayStd(this.dailyReturns);
    this.dataLoaded = true;
    console.log('Historical data loaded:', {
      numDays: prices.length,
      meanDailyReturn: this.muDaily,
      stdDevDailyReturn: this.sigmaDaily,
      annualizedReturn: (1 + this.muDaily) ** 252 - 1,
      annualizedVolatility: this.sigmaDaily * Math.sqrt(252)
    });
  }

  async runSimulation() {
    if (!this.dataLoaded || this.isLoading) return;
    this.isLoading = true;
    this.progress = 0;

    try {
      const paths: number[][] = [];
      const finalValues: number[] = [];
      const daysPerYear = 252;
      const totalDays = this.params.years * daysPerYear;
      const monthlyInvestmentDaily = this.params.monthlyInvestment * 12 / daysPerYear;

      // Generate paths
      for (let sim = 0; sim < this.params.numSimulations; sim++) {
        let value = this.params.initialInvestment;
        const path = [value];

        for (let day = 0; day < totalDays; day++) {
          // Add daily portion of monthly investment
          value += monthlyInvestmentDaily;

          // Generate random return from historical distribution
          const dailyReturn = this.randomNormal(this.muDaily, this.sigmaDaily);
          value *= (1 + dailyReturn);

          // Store value at monthly intervals for visualization
          if (day % 21 === 0) { // Approximately monthly
            path.push(value);
          }
        }

        paths.push(path);
        finalValues.push(value);

        // Update progress every 10 simulations or on the last one
        if (sim % 10 === 0 || sim === this.params.numSimulations - 1) {
          this.progress = (sim + 1) / this.params.numSimulations * 100;
          // Allow UI to update by yielding to the event loop
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // Calculate statistics
      finalValues.sort((a, b) => a - b);
      const result: SimulationResult = {
        finalValues,
        meanFinalValue: this.arrayMean(finalValues),
        percentile5: this.quantile(finalValues, 0.05),
        percentile95: this.quantile(finalValues, 0.95),
        paths
      };

      this.result = result;
      console.log(result);
      this.updateChart(result);
    } finally {
      this.isLoading = false;
      this.progress = 0;
    }
  }

  private updateChart(result: SimulationResult) {
    // Create labels for monthly intervals
    const labels = Array.from(
      { length: Math.floor(this.params.years * 12) + 1 },
      (_, i) => i === 0 ? 'Start' : `Year ${Math.floor(i/12)}`
    );

    // Select a subset of paths to visualize
    const pathsToShow = Math.min(100, result.paths.length);
    const step = Math.floor(result.paths.length / pathsToShow);
    const selectedPaths = result.paths.filter((_, i) => i % step === 0);

    // Create datasets
    const datasets = selectedPaths.map((path, i) => ({
      data: path,
      borderColor: `rgba(0, 123, 255, ${i === 0 ? 0.8 : 0.1})`,
      borderWidth: i === 0 ? 2 : 1,
      pointRadius: 0,
      fill: false
    }));

    this.lineChartData = {
      labels,
      datasets
    };

    if (this.chart) {
      this.chart.update();
    }
  }

  public randomNormal(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  public arrayMean(arr: number[]): number {
    return arr.reduce((acc, val) => acc + val, 0) / arr.length;
  }

  public arrayStd(arr: number[]): number {
    const mean = this.arrayMean(arr);
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (arr.length - 1);
    return Math.sqrt(variance);
  }

  public quantile(arr: number[], q: number): number {
    const pos = (arr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (base + 1 < arr.length) {
      return arr[base] + rest * (arr[base + 1] - arr[base]);
    }
    return arr[base];
  }
}
