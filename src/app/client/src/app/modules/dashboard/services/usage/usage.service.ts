import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LearnerService, UserService, ICourses, IEnrolledCourses, PublicDataService } from '@sunbird/core';
import { ConfigService, ServerResponse } from '@sunbird/shared';
import { BehaviorSubject, Observable } from 'rxjs';
import { skipWhile, map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UsageService {
  private enrolledCourses: Array<ICourses>;
  /**
   * To get details about user profile.
   */
  private userService: UserService;
  /**
   *  To do learner service api call.
   */
  private learnerService: LearnerService;
  /**
   *  To get url, app configs.
   */
  private config: ConfigService;
  /**
   * user id
   */
  userid: string;
  /**
   * Reference of public data service
   */
  public publicDataService: PublicDataService;
  /**
   * BehaviorSubject Containing enrolled courses.
   */
  private _enrolledCourseData$ = new BehaviorSubject<IEnrolledCourses>(undefined);
  /**
   * Read only observable Containing enrolled courses.
   */
  public readonly enrolledCourseData$: Observable<IEnrolledCourses> = this._enrolledCourseData$.asObservable()
    .pipe(skipWhile(data => data === undefined || data === null)); http: HttpClient;
  /**
* the "constructor"
*
* @param {LearnerService} learnerService Reference of LearnerService.
* @param {UserService} userService Reference of UserService.
* @param {ConfigService} config Reference of ConfigService
 * @param {HttpClient} http HttpClient reference
 */
  constructor(http: HttpClient, userService: UserService, learnerService: LearnerService,
    config: ConfigService, publicDataService: PublicDataService) {
    this.http = http;
    this.config = config;
    this.learnerService = learnerService;
    this.userService = userService;
    this.userid = this.userService.userid;
    this.publicDataService = publicDataService;
  }

  getData(url: string) {
    return this.http.get(url, { responseType: 'json' });
  }
  getEnrolledCourses() {
    const option = {
      url: this.config.urlConFig.URLS.COURSE.GET_ENROLLED_COURSES + '/' + this.userid,
      param: { ...this.config.appConfig.Course.contentApiQueryParams, ...this.config.urlConFig.params.enrolledCourses }
    };
    return this.learnerService.get(option);
  }
  /**
 * To method calls the batch list API
 */
  getBatches(data) {
    const option = {
      url: this.config.urlConFig.URLS.BATCH.GET_BATCHS,
      data: data
    };
    return this.learnerService.post(option);
  }
  populateCourseDashboardData(identifier) {
    const option = {
      url: this.config.urlConFig.URLS.DASHBOARD.COURSE_PROGRESS_V2 + '/' + identifier + '?limit=200&offset=0',
    };
    return this.learnerService.get(option);
  }
  getUserDetailsReport(data) {
    const option = {
      url: this.config.urlConFig.URLS.ADMIN.USER_SEARCH,
      data: data
    };
    return this.learnerService.post(option);
  }
  getOrgDetails(data) {
    const option = {
      url: this.config.urlConFig.URLS.ADMIN.ORG_SEARCH,
      data: data
    };
    return this.publicDataService.post(option);
  }
}