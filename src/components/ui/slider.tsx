"use client";
import * as React from "react";
import {animate,motion,useMotionValue,useTransform,type MotionValue} from "motion/react";
import {cva,type VariantProps} from "class-variance-authority";
import {cn} from "@/lib/utils";
import * as Primitive from "@radix-ui/react-slider";
import {assignMotionRef} from "@/lib/cojeev-motion/refs";
import {motionTokens,trackMotion,useChoreography} from "@/lib/cojeev-motion/choreography";
import {useMotionVisibility} from "@/lib/cojeev-motion/use-motion-visibility";
import {usePaintSize} from "@/lib/cojeev-motion/use-organic-value";
import {organicLinePath} from "@/lib/cojeev-motion/progress-geometry";
import {sliderRailPath,sliderRubberPath,sliderScreenVelocity,sliderThumbPath} from "@/lib/cojeev-motion/slider-geometry";

export const sliderVariants=cva("v-slider",{variants:{variant:{default:"",pink:"-pink"}},defaultVariants:{variant:"default"}});
export type SliderAppearance="organic"|"line"|"segmented"|"rubber";
export type SliderProps=React.ComponentProps<typeof Primitive.Root> & VariantProps<typeof sliderVariants> & {thumbLabel?:string|((index:number)=>string);appearance?:SliderAppearance};
function RailPaint({energy,extent,appearance,vertical=false,filled=false}:{energy:MotionValue<number>;extent:MotionValue<number>;appearance:SliderAppearance;vertical?:boolean;filled?:boolean}){
 const ref=React.useRef<SVGSVGElement|null>(null),{width,height}=usePaintSize(ref);
 const viewBox=useTransform([width,height],([w,h])=>`0 0 ${w} ${h}`);
 const d=useTransform([width,height,energy,extent],([w,h,e,span])=>{
  const length=Number(vertical?h:w),thickness=Number(vertical?w:h);
  if(appearance==="rubber")return filled?sliderRubberPath(length,thickness,Number(span),Number(e)):sliderRailPath(length,Math.min(thickness,4),0);
  return appearance==="organic"?sliderRailPath(length,thickness,filled?Number(e):0):organicLinePath(length,thickness,1,filled?Number(e):0);
 });
 return <motion.svg ref={ref} className="v-slider__paint" viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true"><motion.path d={d} transform={vertical?"matrix(0 1 1 0 0 0)":undefined}/></motion.svg>;
}
function ThumbPaint({energy,vertical}:{energy:MotionValue<number>;vertical:boolean}){
 const d=useTransform(energy,v=>sliderThumbPath(vertical?"vertical":"horizontal",Number(v)));
 return <svg className="v-slider__thumb-paint" viewBox="0 0 24 24" aria-hidden="true"><motion.path d={d}/></svg>;
}
export function Slider({className,variant,appearance="organic",value,defaultValue=[50],min=0,max=100,thumbLabel,onValueChange,style,ref,onPointerEnter,onPointerLeave,onPointerDown,onPointerUp,onPointerCancel,onLostPointerCapture,onFocusCapture,onBlurCapture,...props}:SliderProps){
 const [uncontrolledValue,setUncontrolledValue]=React.useState(defaultValue),values=value??uncontrolledValue;
 const [pressed,setPressed]=React.useState(false),[movingIndex,setMovingIndex]=React.useState(0);
 const activeIndex=React.useRef(0);
 const host=React.useRef<HTMLSpanElement|null>(null),{enabled,inView}=useMotionVisibility(host),{quiet}=useChoreography();
 const attach=React.useCallback((node:HTMLSpanElement|null)=>{host.current=node;const release=assignMotionRef(ref,node);return()=>{host.current=null;release()}},[ref]);
 const still=quiet||!enabled||!inView||!!props.disabled,vertical=props.orientation==="vertical",quietEnergy=useMotionValue(0),energy=useMotionValue(0),previousValues=React.useRef(values);
 const cancelSettle=React.useRef<(()=>void)|undefined>(undefined);
 const resetEnergy=React.useCallback(()=>{cancelSettle.current?.();cancelSettle.current=undefined;energy.jump(0)},[energy]);
 // Policy/domain changes intentionally discard momentum; equal-value arrays do not.
 React.useLayoutEffect(resetEnergy,[resetEnergy,still,vertical,props.dir,props.inverted,min,max]);
 React.useEffect(()=>()=>resetEnergy(),[resetEnergy]);
 const selectedSpan=max>min?(Math.max(...values)-(values.length>1?Math.min(...values):min))/(max-min):0;
 const extent=useMotionValue(selectedSpan);
 React.useLayoutEffect(()=>{extent.jump(selectedSpan)},[extent,selectedSpan]);
 React.useLayoutEffect(()=>{
  const previous=previousValues.current;previousValues.current=values;
  const changed=values.map((item,index)=>item!==previous[index]?index:-1).filter(index=>index>=0);
  if(!changed.length)return;
  cancelSettle.current?.();cancelSettle.current=undefined;
  const index=changed.includes(activeIndex.current)?activeIndex.current:changed[0],delta=values[index]-previous[index];
  activeIndex.current=index;setMovingIndex(index);
  if(still||!delta){energy.jump(0);return}
  const direction=props.dir??(host.current?getComputedStyle(host.current).direction:undefined);
  energy.set(sliderScreenVelocity(delta/(max-min)*5,{orientation:vertical?"vertical":"horizontal",dir:direction==="rtl"?"rtl":"ltr",inverted:!!props.inverted}));
  const settle=animate(energy,0,{...motionTokens.spring.responsive,restDelta:.005,restSpeed:.05});
  cancelSettle.current=trackMotion(settle);
 },[energy,host,max,min,props.dir,props.inverted,still,values,vertical]);
 const handleValueChange=(next:number[])=>{
  const changed=next.findIndex((item,index)=>item!==values[index]);
  if(changed>=0)activeIndex.current=changed;
  if(value===undefined)setUncontrolledValue(next);onValueChange?.(next);
 };
 return <Primitive.Root {...props} ref={attach} data-slot="slider" data-part="track" data-range={values.length>1||vertical||undefined} data-appearance={appearance} data-motion={still?"off":"on"} data-pressed={pressed||undefined} className={cn(sliderVariants({variant}),className)} value={value} defaultValue={defaultValue} min={min} max={max} onValueChange={handleValueChange} style={style}
  onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}
  onPointerDown={event=>{onPointerDown?.(event);const thumb=event.target instanceof Element?event.target.closest<HTMLElement>("[data-thumb-index]"):null;if(thumb)activeIndex.current=Number(thumb.dataset.thumbIndex);if(!event.defaultPrevented&&!props.disabled&&event.button===0)setPressed(true)}}
  onPointerUp={event=>{onPointerUp?.(event);setPressed(false)}} onPointerCancel={event=>{onPointerCancel?.(event);setPressed(false)}} onLostPointerCapture={event=>{onLostPointerCapture?.(event);setPressed(false)}}
  onFocusCapture={event=>{onFocusCapture?.(event);const thumb=event.target instanceof Element?event.target.closest<HTMLElement>('[data-thumb-index]'):null;if(thumb)activeIndex.current=Number(thumb.dataset.thumbIndex)}}
  onBlurCapture={onBlurCapture}>
   <Primitive.Track data-slot="slider-track"><RailPaint {...{energy,extent,appearance,vertical}}/><Primitive.Range data-slot="slider-range"><RailPaint {...{energy,extent,appearance,vertical}} filled/></Primitive.Range></Primitive.Track>
   {values.map((_,index)=><Primitive.Thumb key={index} data-slot="slider-thumb" data-part="thumb" data-thumb-index={index} aria-labelledby={thumbLabel===undefined&&values.length===1?props["aria-labelledby"]:undefined} aria-describedby={props["aria-describedby"]} aria-invalid={props["aria-invalid"]} aria-label={typeof thumbLabel==="function"?thumbLabel(index):thumbLabel??(values.length>1?`Value ${index+1}`:props["aria-label"])}><ThumbPaint energy={index===movingIndex?energy:quietEnergy} vertical={vertical}/></Primitive.Thumb>)}
 </Primitive.Root>;
}
export type SliderWrapperProps = React.ComponentProps<"div">;
export function SliderWrapper({ className, ...props }: SliderWrapperProps) {
  return (
    <div
      data-slot="slider-wrapper"
      data-part="root"
      className={cn("v-sliderwrap grid gap-3", className)}
      {...props}
    />
  );
}
export type SliderRowProps = React.ComponentProps<"div">;
export function SliderRow({ className, ...props }: SliderRowProps) {
  return (
    <div
      data-slot="slider-row"
      className={cn("v-sliderwrap__row", className)}
      {...props}
    />
  );
}
export type SliderOutputProps = React.ComponentProps<"output">;
export function SliderOutput({ className, ...props }: SliderOutputProps) {
  return (
    <output
      data-slot="slider-output"
      data-part="indicator"
      className={className}
      {...props}
    />
  );
}
