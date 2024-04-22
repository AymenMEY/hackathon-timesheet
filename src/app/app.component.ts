import { Component } from '@angular/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatCardModule} from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import {provideNativeDateAdapter} from '@angular/material/core';
import { NgIf } from '@angular/common';
import { NgFor } from '@angular/common';
import { NgClass } from '@angular/common';
import * as businessDaysData from './business_days.json';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, addDays, getWeek, parse} from 'date-fns';

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [MatCardModule, MatDatepickerModule, NgIf, NgFor, NgClass, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})


export class AppComponent {
  title = 'hackathon-timesheet';
  businessDaysData: any = (businessDaysData as any).default; // Accessing the imported JSON data
  calendarDates: Date[] = [];
  febDays: Date[] = [];
  marchDays: Date[] = [];
  aprilDays: Date[] = [];
  weekDays = ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'];
  getWeek = getWeek;
  selectedDate: Date = new Date();
  selectedDays: any[] = [];
  timesheet: any[] = [];
  timesheet_submitted: boolean = false;

  constructor() {
    this.febDays = this.getCalendarDays(2024, 1);
    this.marchDays = this.getCalendarDays(2024, 2);
    this.aprilDays = this.getCalendarDays(2024, 3);
    this.getCurrentWeek();
    this.initiateTimesheet();
  }

  initiateTimesheet() {
    for(let i = 0; i< 5; i++) {
      this.timesheet.push({
        engId: undefined,
        actId: undefined,
        role: undefined,
        workLoc: undefined, 
        sat: undefined,
        sun: undefined,
        mon: undefined,
        tue: undefined,
        wed: undefined,
        thu: undefined,
        fri: undefined
      })
    }
  }

  submitTimesheet() {
    this.timesheet_submitted = true;
    console.log(this.timesheet)
  }

  getDateStatus(date: Date, month: number) {
    let isToday = '';
    if (date.getMonth() != month) {
      return isToday + 'disabled'
    }
    if (date.getDay() === 6 || date.getDay() === 0) {
      return isToday + 'nonworking'
    }
    if (date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth()) {
      isToday = 'today ';
    }

    if (this.isInCurrentWeek(date)) {
      return isToday + 'current';
    }

    let dayFound = this.businessDaysData.days.filter((d: any) => {
      const d1 = parse(d.date, "dd/MM/yyyy", new Date());
      return  d1.getDate() === date.getDate() && d1.getMonth() == date.getMonth();
    })[0];

    return dayFound && dayFound.status ? isToday + dayFound.status.toLowerCase() : isToday + 'default'
  }

  selectDate(date:Date) {
    this.selectedDate = date;
    this.getCurrentWeek();
  }

  getCurrentWeek() {
    let currentDay = this.selectedDate.getDay();
    let startDay = addDays(this.selectedDate, -1*(currentDay+1));
    this.selectedDays = [];
    for (let i = 0; i < 7; i++) {
      let newDate = addDays(startDay, i);
      let timesheetData = this.getTimesheetFromDate(newDate);
      this.selectedDays.push({
        date: addDays(startDay, i),
        status: timesheetData ? timesheetData.status : undefined,
        timesheet: timesheetData ? timesheetData.timesheet : undefined
      });
    }
  }

  getHours(day: any, type: string) {
    if (!day.timesheet) return 0;
    return day.timesheet.reduce((acc: number, curr: any) => {
      if (curr.engID[0] === type || type === 'ALL') return acc + curr.hours
      return acc + 0
    }, 0);
  }

  getTotalHours(type: string) {
    return this.selectedDays.reduce((acc: number, curr: any) => {
      if(!curr.timesheet) return acc + 0;
      let tempAcc = 0;
      curr.timesheet.forEach((t:any) => tempAcc += t.engID[0] === type || type === 'ALL' ? t.hours : 0)
      return acc + tempAcc;
    }, 0);
  }

  isInCurrentWeek(date: Date) {
    for(let d of this.selectedDays) {
      if(d.date.getDate() === date.getDate() && d.date.getMonth() == date.getMonth()) {
        return true
      };
    }
    return false;
  }

  getTimesheetFromDate(date: Date) {
    for(let d of this.businessDaysData.days) {
      const d1 = parse(d.date, "dd/MM/yyyy", new Date());
      if(d1.getDate() === date.getDate() && d1.getMonth() == date.getMonth()) {
        return d
      };
    }
  }

  getCalendarDays(year: number, month: number) {
    const start = startOfMonth(new Date(year, month));
    const end = endOfMonth(new Date(year, month));
    let days = eachDayOfInterval({ start, end });
    let startDay = getDay(start);
    startDay = (startDay + 1) % 7; 
    for (let i = 0; i < startDay; i++) {
      days.unshift(addDays(start, -i - 1));
    }
    let endDay = getDay(end);
    endDay = (endDay + 1) % 7;
    for (let i = 1; days.length < 42; i++) {
      days.push(addDays(end, i));
    }
    return days;
  }


}

