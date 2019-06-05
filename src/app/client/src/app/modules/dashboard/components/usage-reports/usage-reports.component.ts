import { IInteractEventEdata, IInteractEventObject, TelemetryInteractDirective } from '@sunbird/telemetry';
import { IImpressionEventInput } from './../../../telemetry/interfaces/telemetry';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UsageService } from './../../services';
import * as _ from 'lodash';
import { DomSanitizer } from '@angular/platform-browser';
import { UserService } from '@sunbird/core';
import { ToasterService, ResourceService, INoResultMessage } from '@sunbird/shared';
import { UUID } from 'angular2-uuid';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService } from '@sunbird/shared';
import { DatePipe } from '@angular/common';
const azureUrl = 'https://nuih.blob.core.windows.net/certificate/course_certificate/';
@Component({
  selector: 'app-usage-reports',
  templateUrl: './usage-reports.component.html',
  styleUrls: ['./usage-reports.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UsageReportsComponent implements OnInit {
  /**
 * Admin Dashboard access roles
 */
  enrolledCourseData: any = [];
  cols: any = [];
  adminDashboard: Array<string>;
  reportMetaData: any;
  chartData: Array<object> = [];
  table: any;
  donutChartData: any = [];
  isTableDataLoaded = false;
  currentReport: any;
  slug: string;
  noResult: boolean;
  noResultMessage: INoResultMessage;
  private activatedRoute: ActivatedRoute;
  telemetryImpression: IImpressionEventInput;
  telemetryInteractEdata: IInteractEventEdata;
  telemetryInteractDownloadEdata: IInteractEventEdata;
  @ViewChild(TelemetryInteractDirective) telemetryInteractDirective;
  constructor(public configService: ConfigService, private usageService: UsageService, private sanitizer: DomSanitizer,
    public userService: UserService, private toasterService: ToasterService,
    public resourceService: ResourceService, activatedRoute: ActivatedRoute, private router: Router, private datePipe: DatePipe
  ) {
    this.activatedRoute = activatedRoute;
  }

  ngOnInit() {
    this.adminDashboard = this.configService.rolesConfig.headerDropdownRoles.adminDashboard;
    const reportsLocation = (<HTMLInputElement>document.getElementById('reportsLocation')).value;
    this.slug = _.get(this.userService, 'userProfile.rootOrg.slug');
    this.usageService.getData(`/${reportsLocation}/${this.slug}/config.json`).subscribe(data => {
      if (_.get(data, 'responseCode') === 'OK') {
        this.noResult = false;
        this.reportMetaData = _.get(data, 'result');
        if (this.reportMetaData[0]) { this.renderReport(this.reportMetaData[0]); }
      }
    }, (err) => {
      console.log(err);
      this.noResultMessage = {
        'messageText': 'messages.stmsg.m0131'
      };
      this.noResult = true;
    });
    this.setTelemetryImpression();
    this.getEnrolledCourses();
  }

  setTelemetryInteractObject(val) {
    return {
      id: val,
      type: 'view',
      ver: '1.0'
    };
  }
  getEnrolledCourses() {
    this.usageService.getEnrolledCourses().subscribe(response => {
      this.enrolledCourseData = [];
      if (_.get(response, 'responseCode') === 'OK') {
        if (response.result.courses.length > 0) {
          this.enrolledCourseData = response.result.courses;
          var self = this;
          _.map(this.enrolledCourseData, function (obj) {
            obj.trainingName = obj.batch.name;
            obj.enrollmentType = obj.batch.enrollmentType;
            obj.startDate = self.datePipe.transform(obj.batch.startDate, 'dd-MMM-yyyy');
            obj.endDate = self.datePipe.transform(obj.batch.endDate, 'dd-MMM-yyyy');
            obj.completedOn = self.datePipe.transform(obj.completedOn, 'dd-MMM-yyyy');
            obj.statusName = (obj.progress === 0) ? 'Not-Started' : ((obj.progress === obj.leafNodesCount || obj.progress > obj.leafNodesCount) ? 'Completed' : 'In-Progress');
            obj.downloadUrl = azureUrl + obj.courseName + '-' + self.userService.userid + '-' + obj.courseId + '.pdf';
          });
          this.initializeColumns();
          this.initializeChart();
        }
      }
    }, (err) => {
      console.log(err);
      this.noResultMessage = {
        'messageText': 'messages.stmsg.m0131'
      };
    });
  }
  initializeChart() {
    this.donutChartData = {
      labels: ['COMPLETED - ' + _.filter(this.enrolledCourseData, { statusName: 'Completed' }).length, 'IN-PROGRESS - ' + _.filter(this.enrolledCourseData, { statusName: 'In-Progress' }).length, 'NOT-STARTED - ' + _.filter(this.enrolledCourseData, { statusName: 'Not-Started' }).length],
      datasets: [
        {
          data: [_.filter(this.enrolledCourseData, { statusName: 'Completed' }).length, _.filter(this.enrolledCourseData, { statusName: 'In-Progress' }).length, _.filter(this.enrolledCourseData, { statusName: 'Not-Started' }).length],
          backgroundColor: [
            "#D93954",
            "#6D6E71",
            "#602320"
          ],
          hoverBackgroundColor: [
            "#D93954",
            "#6D6E71",
            "#602320"
          ]
        }]
    };
  }
  initializeColumns() {
    this.cols = [
      { field: 'trainingName', header: 'Training Name' },
      { field: 'enrollmentType', header: 'Enrollment Type' },
      { field: 'startDate', header: 'Start Date' },
      { field: 'endDate', header: 'Target End Date' },
      { field: 'completedOn', header: 'Completion Date' },
      { field: 'statusName', header: 'Status' },
      { field: 'certificate', header: 'Certificate' }
    ]
  }
  reportType(reportType) {
    this.telemetryInteractDirective.telemetryInteractObject = this.setTelemetryInteractObject(_.get(this.currentReport, 'id'));
    this.telemetryInteractDirective.telemetryInteractEdata = {
      id: `report_${reportType}`,
      type: 'click',
      pageid: this.activatedRoute.snapshot.data.telemetry.pageid
    };
    this.telemetryInteractDirective.onClick();
  }

  setTelemetryImpression() {
    this.telemetryInteractEdata = {
      id: 'report-view',
      type: 'click',
      pageid: this.activatedRoute.snapshot.data.telemetry.pageid
    };

    this.telemetryInteractDownloadEdata = {
      id: 'report-download',
      type: 'click',
      pageid: this.activatedRoute.snapshot.data.telemetry.pageid
    };

    this.telemetryImpression = {
      context: {
        env: this.activatedRoute.snapshot.data.telemetry.env
      },
      object: {
        id: this.userService.userid,
        type: 'user',
        ver: '1.0'
      },
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
        uri: this.router.url
      }
    };
  }

  renderReport(report: any) {
    this.currentReport = report;
    this.isTableDataLoaded = false;
    const url = report.dataSource;
    this.table = {};
    this.chartData = [];
    this.usageService.getData(url).subscribe((response) => {
      if (_.get(response, 'responseCode') === 'OK') {
        const data = _.get(response, 'result');
        if (_.get(report, 'charts')) { this.createChartData(_.get(report, 'charts'), data); }
        if (_.get(report, 'table')) { this.renderTable(_.get(report, 'table'), data); }
      } else {
        console.log(response);
      }
    }, err => { console.log(err); });
  }

  createChartData(charts, data) {
    _.forEach(charts, chart => {
      const chartObj: any = {};
      chartObj.options = _.get(chart, 'options') || { responsive: true };
      chartObj.colors = _.get(chart, 'colors') || ['#024F9D'];
      chartObj.chartType = _.get(chart, 'chartType') || 'line';
      chartObj.labels = _.get(chart, 'labels') || _.get(data, _.get(chart, 'labelsExpr'));
      chartObj.legend = (_.get(chart, 'legend') === false) ? false : true;
      chartObj.datasets = [];
      _.forEach(chart.datasets, dataset => {
        chartObj.datasets.push({
          label: dataset.label,
          data: _.get(dataset, 'data') || _.get(data, _.get(dataset, 'dataExpr'))
        });
      });
      this.chartData.push(chartObj);
    });

  }

  renderTable(table, data) {
    this.table.header = _.get(table, 'columns') || _.get(data, _.get(table, 'columnsExpr'));
    this.table.data = _.get(table, 'values') || _.get(data, _.get(table, 'valuesExpr'));
    this.isTableDataLoaded = true;
  }

  downloadCSV(url) {
    this.usageService.getData(url).subscribe((response) => {
      if (_.get(response, 'responseCode') === 'OK') {
        const data = _.get(response, 'result');
        const blob = new Blob(
          [data],
          {
            type: 'text/csv;charset=utf-8'
          }
        );
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        //        a.style = 'display: none';
        a.href = downloadUrl;
        a.download = UUID.UUID() + '.csv';
        a.click();
        document.body.removeChild(a);
      } else {
        this.toasterService.error(this.resourceService.messages.emsg.m0019);
      }
    }, (err) => {
      console.log(err);
      this.toasterService.error(this.resourceService.messages.emsg.m0019);
    });
  }

  transformHTML(data: any) {
    return this.sanitizer.bypassSecurityTrustHtml(data);
  }
}
