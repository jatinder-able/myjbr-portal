import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LearnerService, UserService, ICourses, IEnrolledCourses } from '@sunbird/core';
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
    config: ConfigService) {
    this.http = http;
    this.config = config;
    this.learnerService = learnerService;
    this.userService = userService;
    this.userid = this.userService.userid;
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
}
