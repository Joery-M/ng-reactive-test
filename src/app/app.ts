import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { reactiveObject } from './utils/reactive';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly outsideCounter = signal(0);
  protected readonly data = reactiveObject({
    count: 1,
    myKey: 'asdf' as string | undefined,
    inner: {
      number: 0,
      numberOutside: this.outsideCounter,
      outsideCount: computed(() => this.outsideCounter() * 2),
    },
  });
  protected readonly otherData = reactiveObject({
    // Value is read once
    otherCount: this.data.count,
    incrementOtherData: () => {
      this.data.count++;
    },
  });
  protected readonly countX2 = computed(() => {
    return this.data.count * 2;
  });
  protected readonly keyValue = computed(() => {
    return this.data['myKey'];
  });
  protected readonly hasMyKey = computed(() => {
    return 'myKey' in this.data;
  });
  protected readonly objectOwnKeys = computed(() => {
    return Object.getOwnPropertyNames(this.data);
  });

  protected readonly innerCountX2 = computed(() => {
    return this.data.inner.number * 2;
  });

  deleteKey() {
    delete this.data.myKey;
  }
  addKey() {
    this.data['myKey'] = Math.floor(Math.random() * 100).toString();
  }
}
