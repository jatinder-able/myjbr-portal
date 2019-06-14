// Angular modules
import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Modules
import { ChartsModule } from 'ng2-charts/ng2-charts';
import { SuiModule } from 'ng2-semantic-ui';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { TelemetryModule } from '@sunbird/telemetry';
import { DiscussionModule } from './../discussion/discussion.module';
// Custome component(s) and services
import {
  CourseConsumptionService, DashboardUtilsService, OrganisationService,
  RendererService, LineChartService, DownloadService, CourseProgressService,
  UsageService
} from './services';
import { OrganisationComponent, CourseConsumptionComponent, CourseProgressComponent, UsageReportsComponent, ContentCreationStaticsComponent } from './components';
// SB core and shared services
import { SearchService } from '@sunbird/core';
import { SharedModule } from '@sunbird/shared';
import { OrderModule } from 'ngx-order-pipe';
// Imported Primeng Modules
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { PermissionDirective } from './directives';
//Imported Org Charts Modules
import { OrgChartModule } from 'ng2-org-chart';
@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule,
    FormsModule,
    ChartsModule,
    SuiModule,
    SharedModule,
    OrderModule,
    TelemetryModule,
    DiscussionModule,
    CalendarModule,
    TableModule,
    ChartModule,
    DropdownModule,
    OrgChartModule
  ],
  declarations: [CourseConsumptionComponent, OrganisationComponent, CourseProgressComponent, UsageReportsComponent, ContentCreationStaticsComponent, PermissionDirective],
  exports: [CourseProgressComponent, PermissionDirective],
  providers: [
    RendererService,
    DashboardUtilsService,
    SearchService,
    LineChartService,
    CourseConsumptionService,
    OrganisationService, DownloadService, CourseProgressService, UsageService, DatePipe]
})
export class DashboardModule { }
