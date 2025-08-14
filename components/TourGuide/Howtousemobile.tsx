import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Image from 'next/image'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "../ui/carousel"
import { HelpCircle } from "lucide-react"

export function AlertDialogMobile() {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button>
                    <HelpCircle />
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogTitle className="text-xl text-center">วิธีใช้งาน</AlertDialogTitle>
                <Carousel>
                    <CarouselContent>
                        <CarouselItem className="flex justify-center">
                            <div className="relative w-full h-[250px]">
                                <Image
                                    src="/assets/images/Classes1.png"
                                    alt="ime"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </CarouselItem>
                        <CarouselItem className="flex justify-center">
                            <div className="relative w-full h-[250px]">
                                <Image
                                    src="/assets/images/Classes2.png"
                                    alt="ime"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </CarouselItem>
                        <CarouselItem className="flex justify-center">
                            <div className="relative w-full h-[250px]">
                                <Image
                                    src="/assets/images/My_Class1.png"
                                    alt="ime"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </CarouselItem>
                        <CarouselItem className="flex justify-center">
                            <div className="relative w-full h-[250px]">
                                <Image
                                    src="/assets/images/My_Class2.png"
                                    alt="ime"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </CarouselItem>
                        <CarouselItem className="flex justify-center">
                            <div className="relative w-full h-[250px]">
                                <Image
                                    src="/assets/images/Ex1.png"
                                    alt="ime"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </CarouselItem>
                        <CarouselItem className="flex justify-center">
                            <div className="relative w-full h-[250px]">
                                <Image
                                    src="/assets/images/Ex2.png"
                                    alt="ime"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </CarouselItem>
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
                <AlertDialogFooter>
                    <AlertDialogAction>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
