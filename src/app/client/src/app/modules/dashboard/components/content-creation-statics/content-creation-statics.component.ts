import { IInteractEventEdata, IInteractEventObject, TelemetryInteractDirective } from '@sunbird/telemetry';
import { IImpressionEventInput } from './../../../telemetry/interfaces/telemetry';
import { Component, OnInit, ViewChild, ViewEncapsulation, OnDestroy } from '@angular/core';
import { UsageService } from './../../services';
import * as _ from 'lodash';
import { DomSanitizer } from '@angular/platform-browser';
import { UserService } from '@sunbird/core';
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
  noResult: boolean;
  value: Date;
  currentDate: Date = new Date();
  fromDate: any;
  toDate: any;
  tableData: any = [];
  polarChartData: any;
  polarChartOptions: any;
  selectedDateRange: string;
  interactObject: any;
  cols: any[];
  noResultMessage: INoResultMessage;
  private activatedRoute: ActivatedRoute;
  telemetryImpression: IImpressionEventInput;
  constructor(private usageService: UsageService, private sanitizer: DomSanitizer, private configService: ConfigService,
    public userService: UserService, private toasterService: ToasterService,
    public resourceService: ResourceService, activatedRoute: ActivatedRoute, private router: Router, public reportService: ReportService, private datePipe: DatePipe
  ) {
    this.activatedRoute = activatedRoute;
  }

  ngOnInit() {
    this.getContentCreationStaticsReport('14d');
  }
  getContentCreationStaticsReport(dateRange) {
    this.selectedDateRange = dateRange;
    this.toDate = new Date();
    this.fromDate = (dateRange === "14d") ? moment().subtract('14', 'days') : ((dateRange === "2m") ? moment().subtract('2', 'months') : moment().subtract('6', 'months'));
    const data = {
      "request": {
        "query": "",
        "filters": {
          "status": [
            "Live"
          ],
          "createdOn": { ">=": this.datePipe.transform(this.fromDate, 'yyyy-MM-ddTHH:MM'), "<=": this.datePipe.transform(this.toDate, 'yyyy-MM-ddTHH:MM') }
        },
        "limit": "100",
        "sort_by": {
          "lastUpdatedOn": "desc"
        },
        "fields": ["identifier", "name", "contentType", "createdFor", "channel", "board", "medium", "gradeLevel", "subject", "lastUpdatedOn", "status", "createdBy", "framework", "createdOn"]
      }
    };
    this.reportService.getContentCreationStaticsReport(data).subscribe((response) => {
      if (_.get(response, 'responseCode') === 'OK') {
        this.tableData = _.reject(_.reject(response.result.content, { contentType: 'CourseUnit' }), { contentType: 'Asset' });
        var self = this;
        _.map(this.tableData, function (obj) {
          obj.subject = _.isEmpty(obj.subject) ? 'N/A' : obj.subject;
          obj.createdOn = self.datePipe.transform(obj.createdOn, 'dd-MMM-yyyy');
        });
        this.initializeColumns();
        this.buildChartData();
      } else {
        this.toasterService.error(this.resourceService.messages.emsg.m0007);
      }
    }, (err) => {
      console.log(err);
      this.toasterService.error(this.resourceService.messages.emsg.m0007);
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
      { field: 'name', header: 'Name' },
      { field: 'board', header: 'Category' },
      { field: 'subject', header: 'Sub-Category' },
      { field: 'gradeLevel', header: 'Topic' },
      { field: 'createdOn', header: 'Creation Date' },
      { field: 'contentType', header: 'Content Type' },
      { field: 'status', header: 'Status' }
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