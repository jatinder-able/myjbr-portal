import { ResourceService } from '../../services/index';
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { ICard } from '../../interfaces';
import * as _ from 'lodash';
import { IImpressionEventInput, IInteractEventObject } from '@sunbird/telemetry';
const azureUrl = 'https://nuih.blob.core.windows.net/certificate/course_certificate/';
@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  /**
* content is used to render IContents value on the view
*/
  @Input() data: ICard;
  @Input() customClass: string;
  @Output() clickEvent = new EventEmitter<any>();

  constructor(public resourceService: ResourceService) {
    this.resourceService = resourceService;
  }
  public onAction(data, action) {
    this.clickEvent.emit({ 'action': action, 'data': data });
  }
  showCourseStatus(statusCode) {
    return (_.round(statusCode) === 0) ? 'Not-Started' : ((_.round(statusCode) > 0 && _.round(statusCode) < 100) ? 'In-progress' : 'Completed');
  }
  downloadCertificate(metaData, courseName) {
    let downloadUrl = azureUrl + courseName + '-' + (<HTMLInputElement>document.getElementById('userId')).value + '-' + metaData.courseId + '.pdf';
    window.open(downloadUrl, '_blank');
  }
}