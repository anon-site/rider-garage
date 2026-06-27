"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Timer,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthNavigationProps {
  currentMonth: { year: number; month: number };
  onMonthChange: (year: number, month: number) => void;
  loading?: boolean;
  maxYears?: number;
}

export function MonthNavigation({ 
  currentMonth, 
  onMonthChange, 
  loading = false,
  maxYears = 3
}: MonthNavigationProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate month options
  const generateMonthOptions = () => {
    const options: { value: string; label: string; year: number; month: number }[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Generate months for current year only (up to current month)
    for (let month = currentMonth; month >= 1; month--) {
      const date = new Date(currentYear, month - 1);
      const value = `${currentYear}-${month.toString().padStart(2, '0')}`;
      const label = date.toLocaleString('en', { month: 'long', year: 'numeric' });
      
      options.push({ value, label, year: currentYear, month });
    }

    return options;
  };

  const monthOptions = generateMonthOptions();
  const currentMonthLabel = monthOptions.find(
    opt => opt.year === currentMonth.year && opt.month === currentMonth.month
  )?.label || 'Select Month';

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth.year, currentMonth.month - 1 + (direction === 'next' ? 1 : -1));
    onMonthChange(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    onMonthChange(now.getFullYear(), now.getMonth() + 1);
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return currentMonth.year === now.getFullYear() && currentMonth.month === now.getMonth() + 1;
  };

  const handleMonthSelect = (year: number, month: number) => {
    onMonthChange(year, month);
    setDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Navigation Buttons */}
      <button
        onClick={() => navigateMonth('prev')}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-all hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>
      
      {/* Month Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-surface-100 px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-surface-200 transition-all hover:bg-surface-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[220px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-600" />
            <span className="truncate">{currentMonthLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-brand-500" />}
            <ChevronDown className={cn(
              "h-4 w-4 text-slate-400 transition-transform duration-200",
              dropdownOpen && "rotate-180 text-brand-600"
            )} />
          </div>
        </button>
        
        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute top-full right-0 sm:left-0 sm:right-auto z-[100] mt-2 w-64 max-h-[320px] overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-slate-200/60 animate-in fade-in zoom-in-95 duration-200 origin-top">
            <div className="p-1.5">
              {/* Current Month Button */}
              {!isCurrentMonth() && (
                <div className="mb-1 border-b border-slate-100 pb-1">
                  <button
                    onClick={() => goToCurrentMonth()}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-100 text-brand-600">
                      <Timer className="h-3.5 w-3.5" />
                    </div>
                    Return to Current Month
                  </button>
                </div>
              )}
              
              {/* Month List */}
              <div className="space-y-0.5">
                {monthOptions.map((option) => {
                  const isSelected = option.year === currentMonth.year && option.month === currentMonth.month;
                  const isCurrent = option.year === new Date().getFullYear() && option.month === new Date().getMonth() + 1;
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleMonthSelect(option.year, option.month)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-all duration-200",
                        isSelected
                          ? "bg-brand-50 text-brand-700 font-bold shadow-sm ring-1 ring-brand-200/50"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                        isSelected ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600 group-hover:shadow-sm group-hover:ring-1 group-hover:ring-slate-200"
                      )}>
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                      
                      <span className="flex-1 truncate">{option.label}</span>
                      
                      {isCurrent && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-200/50">
                          Current
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <button
        onClick={() => navigateMonth('next')}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-all hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Next month"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
      
      {/* Quick Actions */}
      <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
        {!isCurrentMonth() && (
          <button
            onClick={goToCurrentMonth}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-brand-600 ring-1 ring-brand-200 transition-all hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Go to current month"
          >
            <Timer className="h-4 w-4" />
            Current
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Compact Version for Small Spaces ── */
export function MonthNavigationCompact({ 
  currentMonth, 
  onMonthChange, 
  loading = false 
}: {
  currentMonth: { year: number; month: number };
  onMonthChange: (year: number, month: number) => void;
  loading?: boolean;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const generateMonthOptions = () => {
    const options: { value: string; label: string; year: number; month: number }[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Generate months for current year only (up to current month)
    for (let month = currentMonth; month >= 1; month--) {
      const date = new Date(currentYear, month - 1);
      const value = `${currentYear}-${month.toString().padStart(2, '0')}`;
      const label = date.toLocaleString('en', { month: 'short', year: 'numeric' });
      
      options.push({ value, label, year: currentYear, month });
    }

    return options;
  };

  const monthOptions = generateMonthOptions();
  const currentMonthLabel = monthOptions.find(
    opt => opt.year === currentMonth.year && opt.month === currentMonth.month
  )?.label || 'Select Month';

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth.year, currentMonth.month - 1 + (direction === 'next' ? 1 : -1));
    onMonthChange(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  const handleMonthSelect = (year: number, month: number) => {
    onMonthChange(year, month);
    setDropdownOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => navigateMonth('prev')}
        disabled={loading}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-surface-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[130px] justify-between transition-all"
        >
          <span className="truncate">{currentMonthLabel}</span>
          <div className="flex items-center gap-1">
            {loading && <Loader2 className="h-3 w-3 animate-spin text-brand-500" />}
            <ChevronDown className={cn(
              "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
              dropdownOpen && "rotate-180 text-brand-600"
            )} />
          </div>
        </button>
        
        {dropdownOpen && (
          <div className="absolute top-full right-0 sm:left-0 sm:right-auto z-[100] mt-1.5 w-48 max-h-60 overflow-y-auto rounded-xl bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-slate-200/60 animate-in fade-in zoom-in-95 duration-200 origin-top">
            <div className="p-1">
              {monthOptions.map((option) => {
                const isSelected = option.year === currentMonth.year && option.month === currentMonth.month;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleMonthSelect(option.year, option.month)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-200",
                      isSelected
                        ? "bg-brand-50 text-brand-700 font-bold shadow-sm ring-1 ring-brand-200/50"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <span className="flex-1 truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      <button
        onClick={() => navigateMonth('next')}
        disabled={loading}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
