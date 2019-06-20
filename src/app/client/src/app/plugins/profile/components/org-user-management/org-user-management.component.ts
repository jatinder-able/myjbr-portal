import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '@sunbird/core';
import {
  ResourceService, ConfigService, IUserProfile, ToasterService
} from '../../../../modules/shared';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { SubscriptionLike as ISubscription } from 'rxjs';
import { IImpressionEventInput, IInteractEventObject } from '@sunbird/telemetry';
import { ActivatedRoute } from '@angular/router';
import { CacheService } from 'ng2-cache-service';
@Component({
  selector: 'app-org-user-management',
  templateUrl: './org-user-management.component.html',
  styleUrls: ['./org-user-management.component.scss']
})
export class OrgUserManagementComponent implements OnInit, OnDestroy {
  /**
  * Reference of User Profile interface
  */
  userProfile: IUserProfile;
  /**
  * telemetryLogs
  */
  telemetryLogs = [];
  /**
  * telemetryImpression
  */
  telemetryImpression: IImpressionEventInput;
  telemetryInteractObject: IInteractEventObject;
  userSubscription: ISubscription;
  constructor(private cacheService: CacheService, public resourceService: ResourceService, public toasterService: ToasterService, public userService: UserService, public configService: ConfigService, public router: Router, private activatedRoute: ActivatedRoute) {

  }

  ngOnInit() {
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
        pageid: 'orgUserManagement',
        subtype: this.activatedRoute.snapshot.data.telemetry.subtype,
        uri: this.router.url,
        visits: this.telemetryLogs
      }
    };
  }

  /**
   *ngOnDestroy unsubscribe the subscription
   */
  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}