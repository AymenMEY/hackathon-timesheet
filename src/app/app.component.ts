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
  selectedWeek: any[] = [];
  timesheet: any[] = [];
  timesheetSubmitted: boolean = false;
  timesheetError: boolean = false;

  constructor() {
    this.febDays = this.getCalendarDays(2024, 1);
    this.marchDays = this.getCalendarDays(2024, 2);
    this.aprilDays = this.getCalendarDays(2024, 3);
    this.updateSelectedWeek();
    this.initTimesheet();
  }

  

  /**
   * Handles timesheet submission and logs the current timesheet
   */
  submitTimesheet() {
    if (this.isTimesheetCorrect()) {
      this.timesheetError = false;
      this.timesheetSubmitted = true;
    } else {
      this.timesheetError = true;
      this.timesheetSubmitted = false;
    }
    console.log(this.timesheet);
  }

  isTimesheetCorrect() {
    function containsUndefinedInArray(arr) {
      // Returns true if any object in the array has any property that is undefined
      console.log(arr);
      return arr.some(obj => Object.values(obj).some(value => value === undefined));
    }
    return !containsUndefinedInArray(this.timesheet);

  }




  ////////////////////////////// Functions for Calendar Section ////////////////////////////////
  /**
   * Build the calendar for a specific month
   * @param {number} year - the year
   * @param {number} month - the month index (0-based)
   */
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

  /**
   * Determines the styling/status of a date in the calendar UI
   * @param {Date} date - the date to check
   * @param {number} month - the current month
   * @returns {string} - the CSS class for the date
   */
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

    if (this.isInSelectedWeek(date)) {
      return isToday + 'current';
    }

    let dayFound = this.businessDaysData.days.filter((d: any) => {
      const d1 = parse(d.date, "dd/MM/yyyy", new Date());
      return  d1.getDate() === date.getDate() && d1.getMonth() == date.getMonth();
    })[0];

    return dayFound && dayFound.status ? isToday + dayFound.status.toLowerCase() : isToday + 'default'
  }


  /** 
   * Update the selected data and trigger the update of the selected week
   */
  selectDate(date:Date) {
    this.selectedDate = date;
    this.updateSelectedWeek();
  }

  /**
   * Updates the selected week based on the selected date
   */
  updateSelectedWeek() {
    let startDay = addDays(this.selectedDate, -(this.selectedDate.getDay() + 1));
    this.selectedWeek = [];
    for (let i = 0; i < 7; i++) {
      let newDate = addDays(startDay, i);
      let timesheetData = this.getTimesheetFromDate(newDate);
      this.selectedWeek.push({
        date: addDays(startDay, i),
        status: timesheetData ? timesheetData.status : undefined,
        timesheet: timesheetData ? timesheetData.timesheet : undefined
      });
    }
    this.updateTimesheetLines();
  }
  /////////////////////////////////////////////////////////////////////////////////////////////
  

  

  
  //////////////////////////// Function for Summary Section ///////////////////////////////////
  /**
   * Calculates hours worked for a specific type of engagement on a given day.
   * @param {any} day - the day containing timesheet entries
   * @param {string} type - the type of engagement (e.g., 'E', 'I, 'A' 'ALL')
   * @returns {number} - total hours worked for the specified type
   */
  getHours(day: any, type: string) {
    if (!day.timesheet) return 0;
    return day.timesheet.reduce((acc: number, curr: any) => {
      if (curr.engID[0] === type || type === 'ALL') return acc + curr.hours
      return acc + 0
    }, 0);
  }

  /**
   * Aggregates hours worked across the selected week for a specific type of engagement.
   * @param {string} type - the type of engagement (e.g., 'E', 'I, 'A' 'ALL')
   * @returns {number} - total hours worked for the specified type during the selected week
   */
  getTotalHours(type: string) {
    return this.selectedWeek.reduce((acc: number, curr: any) => {
      if(!curr.timesheet) return acc + 0;
      let tempAcc = 0;
      curr.timesheet.forEach((t:any) => tempAcc += t.engID[0] === type || type === 'ALL' ? t.hours : 0)
      return acc + tempAcc;
    }, 0);
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////


  /////////////////////////////Timesheet Section//////////////////////////////////////////////
  /**
   * Initializes timesheet with default values for 10 entries
   */
  initTimesheet() {
    const blankToFill = -(this.timesheet.length-10);
    for (let i = 0; i < blankToFill; i++) {
      console.log(i, -(this.timesheet.length-10));
      this.timesheet.push({ engID: undefined, actID: undefined, role: undefined, workLoc: undefined, sat: undefined, sun: undefined, mon: undefined, tue: undefined, wed: undefined, thu: undefined, fri: undefined });
    }
    console.log("TM=>", this.timesheet);
  }

  updateTimesheetLines() {
    // Reducing the data array to the specified structure
    const summary = this.selectedWeek.reduce((acc, item) => {
      if (item.timesheet) {
          item.timesheet.forEach(ts => {
              const { engID, actID, role, workLoc, hours } = ts;
              const dayOfWeek = this.getDayOfWeek(item.date);
              const key = `${engID}_${actID}_${role}_${workLoc}`;
              if (!acc[key]) {
                  acc[key] = {engID,actID, role, workLoc, sat: '',sun: '',mon: '',tue: '',wed: '',thu: '',fri: ''};
              }
              acc[key][dayOfWeek] = hours;
          });
      }
      return acc;
    }, {});
    // Converting the accumulated object into an array
    this.timesheet = Object.values(summary);
    this.initTimesheet();
  }


  ///////////////////////Helpers function/////////////////////////////////////
  /**
   * Checks if a date is within the selected week
   * @param {Date} date - the date to check
   * @returns {boolean}
   */
  isInSelectedWeek(date: Date) {
    return this.selectedWeek.some(d => d.date.getDate() === date.getDate() && d.date.getMonth() === date.getMonth());
  }

  /**
   * Retrieves timesheet data for a specific date
   * @param {Date} date - the date to check
   * @returns {any} - the timesheet data or undefined
   */
  getTimesheetFromDate(date: Date) {
    for(let d of this.businessDaysData.days) {
      const d1 = parse(d.date, "dd/MM/yyyy", new Date());
      if(d1.getDate() === date.getDate() && d1.getMonth() == date.getMonth()) {
        return d
      };
    }
  }

  // Helper function to get the day of week as string from date
  getDayOfWeek(date: Date) {
    const dayOfWeek = new Date(date).getUTCDay(); // Using UTC day to match your date string
    console.log(date, dayOfWeek);
    return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][dayOfWeek];
  }

  


}

