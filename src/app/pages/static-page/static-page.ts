import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-static-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="frame-shell">
      <iframe
        class="frame"
        [src]="safeUrl()"
        [title]="pageTitle()"
      ></iframe>
    </main>
  `,
  styles: `
    .frame-shell {
      height: 100%;
      width: 100%;
    }

    .frame {
      border: 0;
      width: 100%;
      height: 100%;
      display: block;
      background: #ffffff;
    }
  `
})
export class StaticPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data
  });

  protected readonly pageTitle = computed(() => {
    const value = this.routeData()['title'];
    return typeof value === 'string' ? value : 'Page';
  });

  protected readonly safeUrl = computed<SafeResourceUrl>(() => {
    const value = this.routeData()['pageUrl'];
    const pageUrl = typeof value === 'string' ? value : '/pages/login.html';
    return this.sanitizer.bypassSecurityTrustResourceUrl(pageUrl);
  });
}
