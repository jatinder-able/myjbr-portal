
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { IFeedbackEdata, IFeedbackObject, IFeedbackEventInput } from '@sunbird/telemetry';
import { TelemetryService } from './../../../telemetry/services/telemetry/telemetry.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceService } from './../../services/resource/resource.service';

@Component({
  selector: 'app-content-rating',
  templateUrl: './content-rating.component.html',
  styleUrls: ['./content-rating.component.scss']
})
export class ContentRatingComponent {
  currentDate: Date = new Date();
  feedbackEdata: IFeedbackEdata;
  @Input() feedbackObject: IFeedbackObject;
  @Input() courseHierarchy?: any;
  submitClicked: false;
  rating: number;
  comments: string;
  @Output('close')
  close = new EventEmitter<any>();
  appTelemetryFeedbackInput: IFeedbackEventInput;
  public telemetryService: TelemetryService;

  constructor(telemetryService: TelemetryService, private router: Router, private activatedRoute: ActivatedRoute, public resourceService: ResourceService) {
    this.telemetryService = telemetryService;
  }

  setFeedbackData() {
    this.feedbackEdata = {
      rating: this.rating,
      comments: this.comments,
    };
    console.log('rating feedback', this.rating, this.comments);
    this.generateFeedbackTelemetry();
  }
  showLearnPage() {
    this.router.navigate(['learn']);
  }
  generateFeedbackTelemetry() {
    if (this.feedbackEdata) {
      this.appTelemetryFeedbackInput = {
        context: {
          env: this.activatedRoute.snapshot.data.telemetry.env
        },
        object: this.feedbackObject,
        edata: this.feedbackEdata
      };
      this.telemetryService.feedback(this.appTelemetryFeedbackInput);
    }
  }
  /**
* popDenys
*/
  popDeny(pop) {
    pop.close();
  }
  sendFeedback(contentFeedbackModal, submitClicked) {
    if (submitClicked) {
      this.setFeedbackData();
    }
    this.router.navigate(['learn']);
    this.closeModal(contentFeedbackModal);
  }
  closeModal(contentFeedbackModal) {
    contentFeedbackModal.deny();
    this.close.emit();
  }
}
