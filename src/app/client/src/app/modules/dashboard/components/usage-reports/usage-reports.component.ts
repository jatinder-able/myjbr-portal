import { IInteractEventEdata, IInteractEventObject, TelemetryInteractDirective } from '@sunbird/telemetry';
import { IImpressionEventInput } from './../../../telemetry/interfaces/telemetry';
import { Component, OnInit, ViewChild, ViewEncapsulation, OnDestroy } from '@angular/core';
import { UsageService } from './../../services';
import * as _ from 'lodash';
import { DomSanitizer } from '@angular/platform-browser';
import { PermissionService, UserService } from '@sunbird/core';
import { ToasterService, ResourceService, INoResultMessage, ConfigService, IUserProfile } from '@sunbird/shared';
import { UUID } from 'angular2-uuid';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import * as moment from 'moment';
import { IEmployee } from 'ng2-org-chart';
import { Subject } from 'rxjs';
@Component({
  selector: 'app-usage-reports',
  templateUrl: './usage-reports.component.html',
  styleUrls: ['./usage-reports.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UsageReportsComponent implements OnInit, OnDestroy {
  /**
 * Admin Dashboard access roles
 */
  adminDashboard: Array<string>;
  azureUrl: string;
  enableCertificateFeature: string;
  enrolledCourseData: any = [];
  selectedEnrolledCourseData: any = [];
  selectedBatch: object;
  userProfile: IUserProfile;
  public unsubscribe = new Subject<void>();
  cols: any = [];
  courseDashboardColumns: any = [];
  batchList: any = [];
  orgList: any = [];
  selectedUserDashboardData: any = [];
  selectedOrg: string = '';
  courseDashboardData: any = [];
  barChartData: any;
  barChartOptions: any;
  reportMetaData: any;
  chartData: Array<object> = [];
  table: any;
  donutChartData: any = [];
  isTableDataLoaded = false;
  currentReport: any;
  slug: string;
  selectedStatus: string = '';
  noResult: boolean;
  courseMentor: boolean = false;
  noResultMessage: INoResultMessage;
  private activatedRoute: ActivatedRoute;
  telemetryImpression: IImpressionEventInput;
  telemetryInteractEdata: IInteractEventEdata;
  telemetryInteractDownloadEdata: IInteractEventEdata;
  @ViewChild(TelemetryInteractDirective) telemetryInteractDirective;
  selectedDateRange: string;
  selectedBatchRange: string;
  fromDate: any;
  toDate: any;
  interactObject: any;
  userDashboardColumns: { field: string; header: string, width: string; }[];
  userDashboardData: any = [];
  userDetailsBlock: any = [];
  trainingDetailsBlock: any = [];
  orgChartData: IEmployee;
  showTrainingstats: boolean = true;
  showTrainingdashboard: boolean = true;
  showUserDetailsReport: boolean = true;
  isOrgAdmin: boolean = false;
  isCreator: boolean = false;
  constructor(public configService: ConfigService, private usageService: UsageService, private sanitizer: DomSanitizer,
    public userService: UserService, public permissionService: PermissionService, private toasterService: ToasterService,
    public resourceService: ResourceService, activatedRoute: ActivatedRoute, private router: Router, private datePipe: DatePipe
  ) {
    this.activatedRoute = activatedRoute;
  }
  ngOnInit() {
    this.azureUrl = (<HTMLInputElement>document.getElementById('certificateUrl')).value + (<HTMLInputElement>document.getElementById('certificateContainerName')).value + '/course_certificate/';
    this.enableCertificateFeature = (<HTMLInputElement>document.getElementById('enableCertificateFeature')).value;
    this.userService.userData$.subscribe(userdata => {
      if (userdata && !userdata.err) {
        this.userProfile = userdata.userProfile;
      }
    });
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
    //Check Course Mentor Role
    this.courseMentor = this.permissionService.checkRolesPermissions(this.configService.rolesConfig.workSpaceRole.courseBatchRoles);
    //Check Org Admin Role
    this.isOrgAdmin = this.permissionService.checkRolesPermissions(this.adminDashboard);
    //Check Creator Role
    this.isCreator = this.permissionService.checkRolesPermissions(this.configService.rolesConfig.headerDropdownRoles.myActivityRole);
    this.getBatches('14d');
    this.getUserDetailsReport('14d');
    this.getOrgDetails();
  }
  setTelemetryInteractObject(val) {
    return {
      id: val,
      type: 'view',
      ver: '1.0'
    };
  }
  downloadCertificate(url) {
    window.open(url, '_blank');
  }
  getEnrolledCourses() {
    this.usageService.getEnrolledCourses().subscribe(response => {
      this.enrolledCourseData = [];
      if (_.get(response, 'responseCode') === 'OK') {
        if (response.result.courses.length > 0) {
          this.enrolledCourseData = response.result.courses;
          var self = this;
          _.map(this.enrolledCourseData, function (obj) {
            obj.batchName = obj.batch.name;
            obj.courseName = obj.courseName;
            obj.enrollmentType = obj.batch.enrollmentType;
            obj.startDate = self.datePipe.transform(obj.batch.startDate, 'dd-MMM-yyyy');
            obj.enrollmentDate = self.datePipe.transform(obj.enrolledDate, 'dd-MMM-yyyy');
            obj.endDate = self.datePipe.transform(obj.batch.endDate, 'dd-MMM-yyyy');
            obj.completedOn = self.datePipe.transform(obj.completedOn, 'dd-MMM-yyyy');
            obj.statusName = (obj.progress === 0) ? 'Not-Started' : ((obj.progress === obj.leafNodesCount || obj.progress > obj.leafNodesCount) ? 'Completed' : 'In-Progress');
            obj.statusName = (obj.statusName != 'Completed' && (new Date(obj.batch.endDate) < new Date())) ? 'Expired' : obj.statusName;
            obj.downloadUrl = self.azureUrl + obj.courseName + '-' + self.userService.userid + '-' + obj.courseId + '.pdf';
          });
          this.selectedEnrolledCourseData = _.cloneDeep(this.enrolledCourseData);
          this.initializeColumns();
          this.initializeDonutChart();
        }
        this.showTrainingstats = true;
        if (_.isEmpty(this.enrolledCourseData)) {
          this.showTrainingstats = false;
        }
      } else {
        this.toasterService.error(this.resourceService.messages.emsg.m0005);
      }
    }, (err) => {
      console.log(err);
      this.noResultMessage = {
        'messageText': 'messages.stmsg.m0131'
      };
    });
  }
  initializeDonutChart() {
    this.trainingDetailsBlock = [];
    let labelsArray = ['Completed', 'In-Progress', 'Not-Started', 'Expired'];
    this.donutChartData = {
      labels: ['COMPLETED', 'IN-PROGRESS', 'NOT-STARTED', 'EXPIRED'],
      datasets: [
        {
          data: [_.filter(this.enrolledCourseData, { statusName: 'Completed' }).length, _.filter(this.enrolledCourseData, { statusName: 'In-Progress' }).length, _.filter(this.enrolledCourseData, { statusName: 'Not-Started' }).length, _.filter(this.enrolledCourseData, { statusName: 'Expired' }).length],
          backgroundColor: [
            "#D93954",
            "#6D6E71",
            "#602320",
            "#a20303"
          ],
          hoverBackgroundColor: [
            "#D93954",
            "#6D6E71",
            "#602320",
            "#a20303"
          ]
        }]
    };
    let self = this;
    _.map(this.donutChartData.datasets[0].data, function (obj, index) {
      self.trainingDetailsBlock.push({ 'label': labelsArray[index], 'value': obj });
    });
  }
  initializeColumns() {
    this.cols = [
      { field: 'batchName', header: 'Batch Name', width: '219px' },
      { field: 'courseName', header: 'Course Name', width: '219px' },
      { field: 'enrollmentType', header: 'Type', width: '81px' },
      { field: 'startDate', header: 'Start Date', width: '90px' },
      { field: 'enrollmentDate', header: 'Enrolled Date', width: '102px' },
      { field: 'endDate', header: 'Target Date', width: '98px' },
      { field: 'completedOn', header: 'Completion Date', width: '116px' },
      { field: 'statusName', header: 'Status', width: '86px' },
    ];
    if (this.enableCertificateFeature === 'true') {
      this.cols.push({ field: 'certificate', header: 'Certificate', width: '75px' });
    }
  }
  initializeCourseDashboardColumns() {
    this.courseDashboardColumns = [
      { field: 'username', header: 'User Name' },
      { field: 'orgName', header: 'Organization Name' },
      { field: 'phone', header: 'Mobile Number' },
      { field: 'enrolledOn', header: 'Enrolled On' },
      { field: 'progress', header: 'Status' }
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
        this.toasterService.error(this.resourceService.messages.emsg.m0005);
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
  getBatches(dateRange) {
    this.selectedBatchRange = dateRange;
    let toDate = new Date();
    let fromDate = (dateRange === "14d") ? moment().subtract('14', 'days') : ((dateRange === "2m") ? moment().subtract('2', 'months') : moment().subtract('6', 'months'));
    const data = {
      'request': {
        'filters': {
          'status': ['0', '1', '2'],
          'createdBy': this.userService.userid,
          "createdDate": { ">=": this.datePipe.transform(fromDate, 'yyyy-MM-ddTHH:MM'), "<=": this.datePipe.transform(toDate, 'yyyy-MM-ddTHH:MM') }
        },
        'sort_by': { 'createdDate': 'desc' }
      }
    };
    this.usageService.getBatches(data).subscribe(response => {
      this.batchList = [];
      this.courseDashboardData = [];
      if (_.get(response, 'responseCode') === 'OK') {
        if (response.result.response.content.length > 0) {
          this.batchList = response.result.response.content;
          this.populateCourseDashboardData(this.batchList[0]);
        }
      } else {
        this.toasterService.error(this.resourceService.messages.emsg.m0005);
      }
    }, (err) => {
      console.log(err);
      this.noResultMessage = {
        'messageText': 'messages.stmsg.m0131'
      };
    })
  }
  getOrgDetails() {
    const data = {
      "request": {
        "filters": {
          rootOrgId: this.userProfile.rootOrgId
        }
      }
    };
    this.usageService.getOrgDetails(data).subscribe(response => {
      if (_.get(response, 'responseCode') === 'OK') {
        if (response.result.response.content.length > 0) {
          this.orgList = response.result.response.content;
          let rootOrgs = _.filter(_.cloneDeep(this.orgList), { isRootOrg: true });
          let subOrgs = _.filter(_.cloneDeep(this.orgList), { isRootOrg: false });
          let tempRootOrgs: any;
          let tempSubOrgs: any;
          let self = this;
          _.map(rootOrgs, function (parentObj, parentIndex) {
            tempRootOrgs = {};
            tempRootOrgs.name = _.get(parentObj, 'orgName');
            tempRootOrgs.designation = '';
            // tempRootOrgs.designation = '(' + _.get(parentObj, 'identifier') + ')';
            tempRootOrgs.img = "";
            tempRootOrgs.subordinates = [];
            _.map(_.filter(_.cloneDeep(subOrgs), { rootOrgId: _.get(parentObj, 'rootOrgId') }), function (childObj) {
              tempSubOrgs = {};
              tempSubOrgs.name = _.get(childObj, 'orgName');
              tempSubOrgs.designation = '';
              // tempSubOrgs.designation = '(' + _.get(childObj, 'identifier') + ')';
              tempSubOrgs.img = "";
              tempSubOrgs.subordinates = [];
              tempRootOrgs.subordinates.push(tempSubOrgs);
            });
          });
          this.orgChartData = tempRootOrgs;
        }
      } else {
        this.toasterService.error(this.resourceService.messages.emsg.m0005);
      }
    }, (err) => {
      console.log(err);
      this.noResultMessage = {
        'messageText': 'messages.stmsg.m0131'
      };
    })
  }
  getUserDetailsReport(dateRange) {
    this.selectedDateRange = dateRange;
    this.toDate = new Date();
    this.fromDate = (dateRange === "14d") ? moment().subtract('14', 'days') : ((dateRange === "2m") ? moment().subtract('2', 'months') : moment().subtract('6', 'months'));
    const data = {
      "request": {
        "filters": {
          "createdDate": { ">=": this.datePipe.transform(this.fromDate, 'yyyy-MM-ddTHH:MM'), "<=": this.datePipe.transform(this.toDate, 'yyyy-MM-ddTHH:MM') },
          "rootOrgId": this.userProfile.rootOrgId
        }
      }
    };
    this.usageService.getUserDetailsReport(data).subscribe((response) => {
      if (_.get(response, 'responseCode') === 'OK') {
        if (response.result.response.content.length > 0) {
          var self = this;
          this.userDashboardData = response.result.response.content;
          _.map(this.userDashboardData, function (parentObj) {
            parentObj.fullName = !_.isEmpty(parentObj.firstName) ? parentObj.firstName : '';
            parentObj.fullName += !_.isEmpty(parentObj.lastName) ? ' ' + parentObj.lastName : '';
            parentObj.createdDate = self.datePipe.transform(parentObj.createdDate, 'dd-MMM-yyyy');
            parentObj.statusName = (parentObj.status === 1) ? 'Active' : 'Inactive';
            parentObj.lastLoginTime = !_.isEmpty(parentObj.lastLoginTime) ? self.datePipe.transform(new Date(_.toNumber(parentObj.lastLoginTime)), 'dd-MMM-yyyy hh:mm:ss') : '';
            parentObj.organizationList = [];
            _.map(parentObj.organisations, function (childObj) {
              childObj.userRoles = _.join(childObj.roles, ' | ');
              childObj.orgName = _.isEmpty(childObj.orgName) ? _.get(_.find(self.orgList, { identifier: childObj.organisationId }), 'orgName') : childObj.orgName;
              parentObj.organizationList.push(childObj.orgName);
            });
            parentObj.organizationArray = parentObj.organizationList;
            parentObj.organizationList = _.toString(parentObj.organizationList);
          });
          this.selectedUserDashboardData = _.cloneDeep(this.userDashboardData);
          this.initializeUserDetailsColumn();
          this.getUserDetailsBlock();
        }
        this.showUserDetailsReport = true;
        if (_.isEmpty(this.userDashboardData)) {
          this.showUserDetailsReport = false;
        }
      } else {
        this.toasterService.error(this.resourceService.messages.emsg.m0005);
      }
    }, (err) => {
      console.log(err);
      this.toasterService.error(this.resourceService.messages.emsg.m0005);
    });
  }
  getUserDetailsBlock() {
    let tempObject = _.cloneDeep(this.userDashboardData);
    let uniqOrgName = [];
    this.userDetailsBlock = [];
    _.map(tempObject, function (parentObj) {
      _.map(parentObj.organisations, function (childObj) {
        if (_.indexOf(uniqOrgName, childObj.orgName) === -1) {
          uniqOrgName.push(childObj.orgName);
        }
      });
    });
    this.userDetailsBlock.push({ 'label': 'Total Users', 'value': tempObject.length });
    let userCount: number;
    let self = this;
    _.map(_.compact(uniqOrgName), function (x) {
      userCount = 0;
      _.map(tempObject, function (y) {
        _.map(y.organisations, function (z) {
          if (!_.isEmpty(z.orgName)) {
            if (z.orgName === x) {
              userCount += 1;
            }
          }
        });
      });
      self.userDetailsBlock.push({ 'label': x, 'value': userCount });
    });
  }
  initializeUserDetailsColumn() {
    this.userDashboardColumns = [
      { field: 'fullName', header: 'Name', width: '175px' },
      { field: 'id', header: 'User ID', width: '249px' },
      { field: 'organizationList', header: 'Organizations', width: '311px' },
      { field: 'createdDate', header: 'CreationDate', width: '92px' },
      { field: 'statusName', header: 'Status', width: '52px' },
      { field: 'lastLoginTime', header: 'LastLoginTime', width: '172px' }
    ]
  }
  filterEnrolledData(statusName) {
    if (this.selectedStatus != statusName) {
      this.selectedStatus = statusName;
      this.selectedEnrolledCourseData = _.filter(_.cloneDeep(this.enrolledCourseData), { statusName: statusName });
    } else {
      this.selectedEnrolledCourseData = _.cloneDeep(this.enrolledCourseData);
      this.selectedStatus = '';
    }
  }
  filterUserDashboardData(orgName) {
    if (this.selectedOrg != orgName) {
      if (orgName != 'Total Users') {

        this.selectedOrg = orgName;
        this.selectedUserDashboardData = _.filter(_.cloneDeep(this.userDashboardData), function (obj) {
          if (_.indexOf(obj.organizationArray, orgName) > -1) {
            return obj;
          }
        });
      } else {
        this.selectedOrg = orgName;
        this.selectedUserDashboardData = _.cloneDeep(this.userDashboardData);
      }
    } else {
      this.selectedUserDashboardData = _.cloneDeep(this.userDashboardData);
      this.selectedOrg = '';
    }
  }
  populateCourseDashboardData(batch) {
    this.usageService.populateCourseDashboardData(_.get(batch, 'identifier')).subscribe(response => {
      this.courseDashboardData = [];
      if (_.get(response, 'responseCode') === 'OK') {
        if (!_.isEmpty(response.result)) {
          this.courseDashboardData = response.result;
          var self = this;
          _.map(this.courseDashboardData.data, function (obj) {
            obj.enrolledOn = self.datePipe.transform(obj.enrolledOn, 'dd-MMM-yyyy');
            obj.isError = false;
            if (obj.progress > 100) {
              obj.progress = 100;
              obj.isError = true;
            }
          });
          this.initializeCourseDashboardColumns();
          this.initializeBarChart(this.courseDashboardData.data);
        }
        this.showTrainingdashboard = true;
        if (_.isEmpty(this.courseDashboardData.data)) {
          this.showTrainingdashboard = false;
        }
      } else {
        this.toasterService.error(this.resourceService.messages.emsg.m0005);
      }
    }, (err) => {
      console.log(err);
      this.noResultMessage = {
        'messageText': 'messages.stmsg.m0131'
      };
    })
  }
  initializeBarChart(responseData) {
    this.barChartData = {
      "labels": [
        "0 - 25%",
        "25% - 50%",
        "50% - 75%",
        "75% - 100%"
      ],
      "datasets": [
        {
          "label": "Users Progress",
          "data": [
            _.filter(responseData, function (obj) { return obj.progress >= 0 && obj.progress < 25 }).length,
            _.filter(responseData, function (obj) { return obj.progress >= 25 && obj.progress < 50 }).length,
            _.filter(responseData, function (obj) { return obj.progress >= 50 && obj.progress < 75 }).length,
            _.filter(responseData, function (obj) { return obj.progress >= 75 && obj.progress <= 100 }).length
          ],
          "fill": false,
          "backgroundColor": [
            "rgba(255, 99, 132, 0.2)",
            "rgba(255, 159, 64, 0.2)",
            "rgba(255, 205, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)"
          ],
          "borderColor": [
            "rgb(255, 99, 132)",
            "rgb(255, 159, 64)",
            "rgb(255, 205, 86)",
            "rgb(75, 192, 192)"
          ],
          "borderWidth": 1
        }
      ]
    }
    this.barChartOptions = {
      "scales": {
        "yAxes": [
          {
            "ticks": {
              "beginAtZero": true,
              "max": this.courseDashboardData.data.length,
            }
          }
        ]
      }
    }
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
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}