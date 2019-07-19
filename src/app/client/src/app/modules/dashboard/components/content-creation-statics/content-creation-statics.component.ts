import { IInteractEventEdata, IInteractEventObject, TelemetryInteractDirective } from '@sunbird/telemetry';
import { IImpressionEventInput } from './../../../telemetry/interfaces/telemetry';
import { Component, OnInit, ViewChild, ViewEncapsulation, OnDestroy } from '@angular/core';
import { UsageService } from './../../services';
import * as _ from 'lodash';
import { DomSanitizer } from '@angular/platform-browser';
import { UserService, PermissionService } from '@sunbird/core';
import { ToasterService, ResourceService, INoResultMessage, ConfigService } from '@sunbird/shared';
import { UUID } from 'angular2-uuid';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from '../../services/reports/reports.service';
import { DatePipe } from '@angular/common';
import { OnDelete } from 'fine-uploader/lib/core';
import { Subject } from 'rxjs';
import * as moment from 'moment';
@Component({
  selector: 'app-content-creation-statics',
  templateUrl: './content-creation-statics.component.html',
  styleUrls: ['./content-creation-statics.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ContentCreationStaticsComponent implements OnInit, OnDestroy {
  public unsubscribe = new Subject<void>();
  noResult: boolean = false;
  value: Date;
  currentDate: Date = new Date();
  fromDate: any;
  toDate: any;
  tableData: any = [];
  selectedTableData: any = [];
  polarChartData: any;
  polarChartOptions: any;
  selectedDateRange: string;
  selectedCategory: string = '';
  interactObject: any;
  cols: any[];
  noResultMessage: INoResultMessage;
  private activatedRoute: ActivatedRoute;
  telemetryImpression: IImpressionEventInput;
  isOrgAdmin: boolean = false;
  isCreator: boolean = false;
  constructor(private usageService: UsageService, private sanitizer: DomSanitizer, private configService: ConfigService,
    public userService: UserService, public permissionService: PermissionService, private toasterService: ToasterService,
    public resourceService: ResourceService, activatedRoute: ActivatedRoute, private router: Router, public reportService: ReportService, private datePipe: DatePipe
  ) {
    this.activatedRoute = activatedRoute;
  }

  ngOnInit() {
    this.getContentCreationStaticsReport('14d');
    //Check Org Admin Role
    this.isOrgAdmin = this.permissionService.checkRolesPermissions(this.configService.rolesConfig.headerDropdownRoles.adminDashboard);
    //Check Creator Role
    this.isCreator = this.permissionService.checkRolesPermissions(this.configService.rolesConfig.headerDropdownRoles.myActivityRole);
  }
  getContentCreationStaticsReport(dateRange) {
    this.selectedDateRange = dateRange;
    this.toDate = new Date();
    this.fromDate = (dateRange === "14d") ? moment().subtract('14', 'days') : ((dateRange === "2m") ? moment().subtract('2', 'months') : moment().subtract('6', 'months'));
    let createdByFilter = this.isOrgAdmin ? [] : [this.userService.userid];
    const data = {
      "request": {
        "query": "",
        "filters": {
          "status": [
            "Live"
          ],
          "createdBy": createdByFilter,
          "createdOn": { ">=": this.datePipe.transform(this.fromDate, 'yyyy-MM-ddTHH:MM'), "<=": this.datePipe.transform(this.toDate, 'yyyy-MM-ddTHH:MM') }
        },
        "limit": "100",
        "sort_by": {
          "lastUpdatedOn": "desc"
        },
        "fields": ["identifier", "creator", "name", "contentType", "mimeType", "createdFor", "channel", "board", "medium", "gradeLevel", "subject", "lastUpdatedOn", "status", "createdBy", "framework", "createdOn"]
      }
    };
    this.reportService.getContentCreationStaticsReport(data).subscribe((response) => {
      if (_.get(response, 'responseCode') === 'OK') {
        this.tableData = _.reject(_.reject(response.result.content, { contentType: 'CourseUnit' }), { contentType: 'Asset' });
        var self = this;
        _.map(this.tableData, function (obj) {
          obj.subject = _.isEmpty(obj.subject) ? 'N/A' : obj.subject;
          obj.createdOn = self.datePipe.transform(obj.createdOn, 'dd-MMM-yyyy');
          obj.contentType = (obj.contentType === 'Resource') ? obj.contentType + " (" + _.replace(_.upperCase(_.split(obj.mimeType, '/')[1]), ' ', '') + ")" : obj.contentType;
        });
        this.selectedTableData = _.cloneDeep(this.tableData);
        this.noResult = false;
        if (_.isEmpty(this.tableData)) {
          this.noResultMessage = {
            'messageText': 'messages.stmsg.m0131'
          };
          this.noResult = true;
        }
        this.initializeColumns();
        this.buildChartData();
      } else {
        this.toasterService.error(this.resourceService.messages.emsg.m0005);
      }
    }, (err) => {
      console.log(err);
      this.toasterService.error(this.resourceService.messages.emsg.m0005);
    });
  }
  buildChartData() {
    var self = this;
    let uniqData = [];
    let uniqLabel = [];
    _.map(_.uniqBy(self.tableData, 'board'), function (obj) {
      uniqData.push(_.filter(self.tableData, { board: _.get(obj, 'board') }).length);
      uniqLabel.push(_.get(obj, 'board'));
    });
    this.initializePolarChart(uniqData, uniqLabel);
  }
  filterCreationData(category) {
    if (this.selectedCategory != category) {
      this.selectedCategory = category;
      this.selectedTableData = _.filter(_.cloneDeep(this.tableData), { board: category });
    } else {
      this.selectedTableData = _.cloneDeep(this.tableData);
      this.selectedCategory = '';
    }
  }
  initializePolarChart(uniqData, uniqLabel) {
    this.polarChartData = {
      datasets: [{
        data: uniqData,
        backgroundColor: [
          "#FF6384",
          "#4BC0C0",
          "#FFCE56",
          "#E7E9ED",
          "#36A2EB"
        ]
      }],
      labels: uniqLabel
    }
    this.polarChartOptions = {
      // scale: {
      //   ticks: {
      //     max: _.sum(uniqData),
      //   }
      // }
    }
  }
  initializeColumns() {
    this.cols = [
      { field: 'name', header: 'Name', width: '166px' },
      { field: 'board', header: 'Category', width: '198px' },
      { field: 'subject', header: 'Sub-Category', width: '98px' },
      { field: 'gradeLevel', header: 'Topic', width: '250px' },
      { field: 'createdOn', header: 'Creation Date', width: '99px' },
      { field: 'creator', header: 'Creator', width: '108px' },
      { field: 'contentType', header: 'Content Type', width: '101px' },
      { field: 'status', header: 'Status', width: '64px' }
      // { field: 'identifier', header: 'Identifier' },
      // { field: 'medium', header: 'Medium' },
      // { field: 'objectType', header: 'Object Type' },
      // { field: 'framework', header: 'Framework' },
    ]
  }
  resetFields() {
    this.fromDate = null;
    this.toDate = null;
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}