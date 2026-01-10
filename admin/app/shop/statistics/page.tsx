"use client";

import { useState, useEffect } from "react";

interface VendorStatistic {
  vendor_id: string;
  vendor_email: string;
  vendor_name: string;
  order_count: number;
  product_count: number;
  total_revenue_cents: number;
  commission_cents: number;
  payout_cents: number;
  currency_code: string;
  paid_order_count: number;
  unpaid_order_count: number;
}

interface StatisticsTotals {
  order_count: number;
  product_count: number;
  total_revenue_cents: number;
  commission_cents: number;
  payout_cents: number;
}

interface StatisticsResponse {
  statistics: VendorStatistic[];
  totals: StatisticsTotals;
  commission_rate: number;
  filters: {
    year: number | null;
    month: number | null;
    vendor_id: string | null;
  };
}

export default function StatisticsPage() {
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [tempCommissionRate, setTempCommissionRate] = useState<string>("10");
  const [statistics, setStatistics] = useState<VendorStatistic[]>([]);
  const [totals, setTotals] = useState<StatisticsTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: "1", label: "Januar" },
    { value: "2", label: "Februar" },
    { value: "3", label: "März" },
    { value: "4", label: "April" },
    { value: "5", label: "Mai" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Dezember" },
  ];

  useEffect(() => {
    loadCommissionRate();
    loadStatistics();
  }, [selectedYear, selectedMonth, selectedVendor]);

  const loadCommissionRate = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/settings/commission", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCommissionRate(data.commission_rate);
        setTempCommissionRate(data.commission_rate.toString());
      }
    } catch (error) {
      console.error("Failed to load commission rate:", error);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const params = new URLSearchParams();
      if (selectedYear) params.set("year", selectedYear);
      if (selectedMonth) params.set("month", selectedMonth);
      if (selectedVendor) params.set("vendor_id", selectedVendor);

      const res = await fetch(`/api/statistics?${params.toString()}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (res.ok) {
        const data: StatisticsResponse = await res.json();
        setStatistics(data.statistics);
        setTotals(data.totals);

        // Extract unique vendors for filter dropdown
        const uniqueVendors = data.statistics.map((s) => ({
          id: s.vendor_id,
          name: s.vendor_name,
        }));
        setVendors(uniqueVendors);
      }
    } catch (error) {
      console.error("Failed to load statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCommissionRate = async () => {
    const rate = parseFloat(tempCommissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      alert("Provision muss zwischen 0 und 100 liegen");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/settings/commission", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ commission_rate: rate }),
      });

      if (res.ok) {
        setCommissionRate(rate);
        // Reload statistics with new commission rate
        await loadStatistics();
        alert("Provision erfolgreich gespeichert");
      } else {
        alert("Fehler beim Speichern der Provision");
      }
    } catch (error) {
      console.error("Failed to save commission rate:", error);
      alert("Fehler beim Speichern der Provision");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const handleSendReport = async () => {
    // Use current filter values or default to previous month
    const now = new Date();
    const year = selectedYear || String(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
    const month = selectedMonth || String(now.getMonth() === 0 ? 12 : now.getMonth());

    const monthName = months.find(m => m.value === month)?.label || month;
    
    if (!confirm(`Möchten Sie den Monatsbericht für ${monthName} ${year} an alle Admins versenden?`)) {
      return;
    }

    try {
      setSendingReport(true);
      const token = localStorage.getItem("auth_token");
      const params = new URLSearchParams();
      params.set("year", year);
      params.set("month", month);

      const res = await fetch(`/api/reports/send?${params.toString()}`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || "Report erfolgreich versendet!");
      } else {
        const error = await res.json();
        alert(error.message || "Fehler beim Versenden des Reports");
      }
    } catch (error) {
      console.error("Failed to send report:", error);
      alert("Fehler beim Versenden des Reports");
    } finally {
      setSendingReport(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Statistik</h1>

      {/* Commission Rate Setting */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Plattform-Provision</h2>
          <button
            onClick={handleSendReport}
            disabled={sendingReport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {sendingReport ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Versende...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Monatsbericht versenden
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">
            Provisionssatz (%):
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={tempCommissionRate}
            onChange={(e) => setTempCommissionRate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md w-32"
          />
          <button
            onClick={handleSaveCommissionRate}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? "Speichere..." : "Speichern"}
          </button>
          <span className="text-sm text-gray-600">
            Aktuell: {commissionRate}%
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Filter</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Jahr</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Alle Jahre</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Monat</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Alle Monate</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Vendor</label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Alle Vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Lädt...</div>
        ) : statistics.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Keine Daten für die ausgewählten Filter
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bestellungen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produkte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gesamtumsatz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provision ({commissionRate}%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auszahlung
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statistics.map((stat) => (
                  <tr key={stat.vendor_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {stat.vendor_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {stat.vendor_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.order_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        {stat.paid_order_count > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            ✓ {stat.paid_order_count} bezahlt
                          </span>
                        )}
                        {stat.unpaid_order_count > 0 && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                            ⏳ {stat.unpaid_order_count} offen
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.product_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(stat.total_revenue_cents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{formatCurrency(stat.commission_cents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(stat.payout_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {totals && (
                <tfoot className="bg-gray-100 font-semibold">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      Gesamt
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {totals.order_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {totals.product_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(totals.total_revenue_cents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{formatCurrency(totals.commission_cents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(totals.payout_cents)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </>
        )}
      </div>
    </div>
  );
}
