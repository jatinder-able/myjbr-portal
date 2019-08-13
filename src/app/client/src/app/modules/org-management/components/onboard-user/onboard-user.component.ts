import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ResourceService, ToasterService, ServerResponse, ConfigService } from '@sunbird/shared';
import { OrgManagementService } from '../../services/org-management/org-management.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IInteractEventInput, IImpressionEventInput, IInteractEventEdata, IInteractEventObject } from '@sunbird/telemetry';
import { UserService, RolesAndPermissions, PermissionService, SearchService } from '@sunbird/core';
import { Subject } from 'rxjs';
import * as _ from 'lodash';
import { DatePipe } from '@angular/common';
import { ExternalIdsModal } from './onboard-user.modal';
@Component({
  selector: 'app-onboard-user',
  templateUrl: './onboard-user.component.html',
  styleUrls: ['./onboard-user.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OnBoardUserComponent implements OnInit, OnDestroy {
  @ViewChild('modal') modal;
  @ViewChild('tabSection') tabSection;
  externalIdsModal: ExternalIdsModal;
  currentExternalIdIndex: number;
  showConfirmationModal: boolean = false;
  externalIdList = new Array<ExternalIdsModal>();
  searchService: SearchService;
  allRoles: Array<RolesAndPermissions>;
  selectedTab: string;
  externalIdEdit: boolean = false;
  userProfile: any;
  userId: any;
  useridReadonly: boolean = false;
  organizationsList: any = [];
  filteredUsers: any = [];
  /**
 * Current page number of inbox list
 */
  pageNumber = 1;
  /**
* reference for ActivatedRoute
*/
  public activatedRoute: ActivatedRoute;
  /**
* reference of config service.
*/
  public config: ConfigService;
  /**
* To call admin service which helps to upload csv file
*/
  public orgManagementService: OrgManagementService;
  /**
* To show/hide loader
*/
  showLoader: boolean;
  /**
   * Create User Form
   */
  createUserForm: FormGroup;
  /**
   * Assign User Form
   */
  assignUserForm: FormGroup;
  /**
 * Create User Contains reference of FormBuilder
 */
  createUserFormBuilder: FormBuilder;
  /**
 *  Assign User Contains reference of FormBuilder
 */
  assignUserFormBuilder: FormBuilder;
  /**
   * To call resource service which helps to use language constant
   */
  public resourceService: ResourceService;
  /**
 * To show toaster(error, success etc) after any API calls
 */
  private toasterService: ToasterService;
  /**
 * Contains page limit of outbox list
 */
  pageLimit: number;
  /**
* Contains redirect url
*/
  redirectUrl: string;
  /**
	 * telemetryImpression
	*/
  telemetryImpression: IImpressionEventInput;
  createUserInteractEdata: IInteractEventEdata;
  assignUserInteractEdata: IInteractEventEdata;
  telemetryInteractObject: IInteractEventObject;
  public unsubscribe$ = new Subject<void>();
  private uploadUserRefLink: string;
  cfSubmitted: boolean = false;
  afSubmitted: boolean = false;
  createUserErrorMessage: string = null;
  assignUserErrorMessage: string = null;
  createdUserId: string = null;
  assignUserSuccess: boolean = false;
  /**
* Constructor to create injected service(s) object
*
* Default method of DetailsComponent class
*
* @param {SearchService} searchService Reference of SearchService
* @param {ResourceService} resourceService To call resource service which helps to use language constant
*/
  constructor(searchService: SearchService, orgManagementService: OrgManagementService, config: ConfigService,
    formBuilder: FormBuilder, toasterService: ToasterService, private router: Router,
    resourceService: ResourceService, activatedRoute: ActivatedRoute, public userService: UserService, private permissionService: PermissionService, public datePipe: DatePipe) {
    this.searchService = searchService;
    this.resourceService = resourceService;
    this.createUserFormBuilder = formBuilder;
    this.assignUserFormBuilder = formBuilder;
    this.orgManagementService = orgManagementService;
    this.toasterService = toasterService;
    this.config = config;
    this.activatedRoute = activatedRoute;
    this.externalIdsModal = new ExternalIdsModal();
    try {
      this.uploadUserRefLink = (<HTMLInputElement>document.getElementById('userUploadRefLink')).value;
    } catch (error) {
      console.log('Error in reading environment variable for user upload reference link');
    }
  }
  /**
 * This method initializes the user form and validates it,
 * also defines array of instructions to be displayed
 */
  ngOnInit() {
    this.userService.userData$.subscribe(userdata => {
      if (userdata && !userdata.err) {
        this.userProfile = userdata.userProfile;
      }
    });
    this.getOrgList();
    this.getAllRoles();
    document.body.classList.add('no-scroll'); // This is a workaround  we need to remove it when library add support to remove body scroll
    this.activatedRoute.data.subscribe(data => {
      if (data.redirectUrl) {
        this.redirectUrl = data.redirectUrl;
      } else {
        this.redirectUrl = '/home';
      }
    });
    this.initializeCreateUserForm();
    this.initializeAssignUserForm();
    // this.showLoader = false;
    this.telemetryImpression = {
      context: {
        env: this.activatedRoute.snapshot.data.telemetry.env
      },
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: 'profile-bulk-upload-user-upload',
        subtype: this.activatedRoute.snapshot.data.telemetry.subtype,
        uri: this.router.url
      }
    };
    this.setInteractEventData();
    this.selectedTab = 'assignUser';
  }
  externalIdsCrud(action, index) {
    action === "add" ?
      (this.externalIdEdit === false ?
        (!_.isEqual(this.externalIdsModal, new ExternalIdsModal()) ?
          (this.externalIdList.push(this.externalIdsModal),
            this.externalIdsModal = new ExternalIdsModal())
          : this.toasterService.error("Please enter the external id details"))
        : (_.assign(this.externalIdList[this.currentExternalIdIndex], this.externalIdsModal),
          this.externalIdsModal = new ExternalIdsModal(),
          this.externalIdEdit = false))
      : action === "clear" ?
        (this.externalIdEdit === false ?
          (this.externalIdsModal = new ExternalIdsModal())
          : (this.externalIdEdit = false,
            this.externalIdsModal = new ExternalIdsModal()))
        : action === 'edit' ?
          (this.externalIdEdit = true,
            this.externalIdsModal = _.cloneDeep(this.externalIdList[index]),
            this.currentExternalIdIndex = index)
          : action === "confirm" ?
            (this.showConfirmationModal = true,
              this.currentExternalIdIndex = index)
            : action === "delete" ?
              (this.externalIdList.splice(this.currentExternalIdIndex, 1))
              : false;
  }
  getOrgList() {
    this.organizationsList = _.filter(_.reject(this.userProfile.organisations, { 'organisationId': this.userProfile.rootOrgId }), function (obj) {
      if (_.indexOf(_.get(obj, 'roles'), 'ORG_ADMIN') > -1) {
        return obj;
      }
    });
  }
  getAllRoles() {
    this.permissionService.permissionAvailable$.subscribe(params => {
      if (params === 'success') {
        this.allRoles = this.permissionService.allRoles;
      }
      let rolesArray = ["COURSE_ADMIN", "COURSE_MENTOR", "CONTENT_REVIEWER", "COURSE_CREATOR", "ANNOUNCEMENT_SENDER", "CONTENT_CREATOR", "PUBLIC"];
      this.allRoles = _.filter(this.allRoles, (role) => {
        return _.indexOf(rolesArray, role.role) > -1;
      });
    });
  }
  searchUsers(query) {
    if (!_.isEmpty(_.trim(query))) {
      let self = this;
      $(".ui-autocomplete-loader").show();
      this.pageLimit = this.config.appConfig.SEARCH.PAGE_LIMIT;
      const searchParams = {
        filters: {
          'rootOrgId': this.userProfile.rootOrgId,
        },
        limit: this.pageLimit,
        pageNumber: this.pageNumber,
        query: query
      };
      this.searchService.userSearch(searchParams).subscribe(
        (apiResponse: ServerResponse) => {
          $(".ui-autocomplete-loader").hide();
          this.useridReadonly = false;
          // if (apiResponse.result.response.count && apiResponse.result.response.content.length > 0) {
          this.filteredUsers = apiResponse.result.response.content;
          _.map(this.filteredUsers, function (obj) {
            obj.fullName = _.replace(obj.firstName, null, '') + ' ' + _.replace(obj.lastName, null, '') + ' -- Created On (' + self.datePipe.transform(obj.createdDate, 'dd/MMM/yyyy') + ')';
          });
          // }
        },
        err => {
          $(".ui-autocomplete-loader").hide();
          this.useridReadonly = false;
          this.toasterService.error(this.resourceService.messages.emsg.m0005);
        }
      );
    } else {
      this.toasterService.error("Please enter a valid user");
      this.assignUserForm.reset();
    }
  }
  initializeCreateUserForm() {
    this.createUserForm = this.createUserFormBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phonenumber: ['', [Validators.required]],
      username: ['', null],
      externalId: ['', null],
      organisationId: ['', null]
      // password: ['', null]
    });
  }
  initializeAssignUserForm() {
    this.assignUserForm = this.assignUserFormBuilder.group({
      userId: ['', [Validators.required]],
      organisationId: ['', [Validators.required]],
      roles: ['', [Validators.required]]
    });
  }
  // convenience getter for easy access to form fields
  get cf() { return this.createUserForm.controls; }
  get af() { return this.assignUserForm.controls; }
  changeTab() {
    this.selectedTab = this.tabSection._activeTab.id;
  }
  createUserSubmit() {
    this.cfSubmitted = true;
    this.createUserErrorMessage = null;
    this.createdUserId = null;
    if (this.createUserForm.invalid) {
      return;
    } else {
      let data = {
        "request": {
          "email": this.createUserForm.value.email,
          "firstName": this.createUserForm.value.firstName,
          "lastName": this.createUserForm.value.lastName,
          // "password": _.isEmpty(_.trim(this.createUserForm.value.password)) ? 'passw0rd' : this.createUserForm.value.password,
          "phone": this.createUserForm.value.phonenumber,
          "channel": this.userProfile.channel,
          "userName": this.createUserForm.value.username,
          "externalIds": this.externalIdList,
          "phoneVerified": true,
          "emailVerified": true
        }
      }
      if (!_.isEmpty(this.createUserForm.value.organisationId)) {
        _.assign(data.request, { "organisationId": this.createUserForm.value.organisationId });
      }
      this.orgManagementService.createUser(data).subscribe(response => {
        if (_.get(response, 'responseCode') === 'OK') {
          this.initializeCreateUserForm();
          this.cfSubmitted = false;
          this.externalIdList = [];
          this.createdUserId = response.result.userId;
        } else {
          this.toasterService.error(this.resourceService.messages.emsg.m0005);
        }
      }, (err) => {
        console.log(err);
        this.createUserErrorMessage = err.error.params.errmsg;
        // this.toasterService.error(this.resourceService.messages.emsg.m0005);
      })
    }
  }
  assignUserSubmit() {
    this.afSubmitted = true;
    this.assignUserErrorMessage = null;
    this.assignUserSuccess = false;
    if (this.assignUserForm.invalid) {
      return;
    } else {
      this.assignUserForm.value.userId = _.cloneDeep(this.assignUserForm.value).userId.id;
      const data = {
        "request": this.assignUserForm.value
      }
      this.orgManagementService.assignUser(data).subscribe(response => {
        if (_.get(response, 'responseCode') === 'OK') {
          this.initializeAssignUserForm();
          this.afSubmitted = false;
          this.assignUserSuccess = true;
          // this.createdUserId = response.result.userId;
        } else {
          this.toasterService.error(this.resourceService.messages.emsg.m0005);
        }
      }, (err) => {
        console.log(err);
        this.assignUserErrorMessage = err.error.params.errmsg;
        // this.toasterService.error(this.resourceService.messages.emsg.m0005);
      });
    }
  }
  /**
 * This method helps to redirect to the parent component
 * page, i.e, org management page
 */
  public redirect() {
    this.router.navigate([this.redirectUrl]);
  }
  ngOnDestroy() {
    document.body.classList.remove('no-scroll'); // This is a workaround we need to remove it when library add support to remove body scroll
    this.modal.deny();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  setInteractEventData() {
    this.createUserInteractEdata = {
      id: 'create-user',
      type: 'click',
      pageid: 'profile-read'
    };
    this.assignUserInteractEdata = {
      id: 'assign-user',
      type: 'click',
      pageid: 'profile-read'
    };
    this.telemetryInteractObject = {
      id: this.userService.userid,
      type: 'user',
      ver: '1.0'
    };
  }
}