import type { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
import { getContext, setContext } from 'svelte';

const EMBLA_CAROUSEL_CONTEXT = Symbol('EMBLA_CAROUSEL_CONTEXT');

type CarouselProps = {
	opts?: EmblaOptionsType;
	plugins?: Parameters<EmblaCarouselType['reInit']>[0];
	orientation?: 'horizontal' | 'vertical';
};

type CarouselContext = {
	emblaApi: EmblaCarouselType | undefined;
	scrollPrev: () => void;
	scrollNext: () => void;
	canScrollPrev: boolean;
	canScrollNext: boolean;
	orientation: 'horizontal' | 'vertical';
};

export function setCarouselContext(context: CarouselContext) {
	setContext(EMBLA_CAROUSEL_CONTEXT, context);
}

export function getCarouselContext(): CarouselContext {
	return getContext(EMBLA_CAROUSEL_CONTEXT);
}

export type { CarouselProps, CarouselContext };
