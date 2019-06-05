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
  fromDate: Date;
  toDate: Date;
  tableData: any = [];
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

  }
  getContentCreationStaticsReport() {
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
        this.tableData = response.result.content;
        this.initializeColumns();
      } else {
        this.toasterService.error(this.resourceService.messages.emsg.m0007);
      }
    }, (err) => {
      console.log(err);
      this.toasterService.error(this.resourceService.messages.emsg.m0007);
    });
  }
  initializeColumns() {
    this.cols = [
      { field: 'identifier', header: 'Identifier' },
      { field: 'subject', header: 'Subject' },
      { field: 'medium', header: 'Medium' },
      { field: 'createdOn', header: 'Created On' },
      { field: 'objectType', header: 'Object Type' },
      { field: 'gradeLevel', header: 'Grade Level' },
      { field: 'framework', header: 'Framework' },
      { field: 'name', header: 'Name' },
      { field: 'contentType', header: 'Content Type' },
      { field: 'board', header: 'Board' },
      { field: 'status', header: 'Status' }
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
