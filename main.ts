enum sgp30_data {
    //% block="TVOC"
    data_1 = 1,
    //% block="eCO2"
    data_2 = 2
}

enum soft_serial {
    //% block="P0"
    serial_0 = 0,
    //% block="P1"
    serial_1 = 1,
    //% block="P2"
    serial_2 = 2,
    //% block="P8"
    serial_8 = 3,
    //% block="P13"
    serial_13 = 4,
    //% block="P14"
    serial_14 = 5,
    //% block="P15"
    serial_15 = 6,
    //% block="P16"
    serial_16 = 7
}

enum PMS5003_data {
    //% block="PM1.0"
    data_1 = 1,
    //% block="PM2.5"
    data_2 = 2,
    //% block="PM10"
    data_3 = 3
}

let buf = pins.createBuffer(2)
let read1, read2, read3
let serial_list = [SerialPin.P0, SerialPin.P1, SerialPin.P2, SerialPin.P8, SerialPin.P13, SerialPin.P14, SerialPin.P15, SerialPin.P16]

function sgp30_init() {
    buf[0] = 0x36;
    buf[1] = 0x82;
    pins.i2cWriteBuffer(0x58, buf)
    pause(10)
    read1 = pins.i2cReadBuffer(0x58, 9)

    buf[0] = 0x20;
    buf[1] = 0x2F;
    pins.i2cWriteBuffer(0x58, buf)
    pause(10)
    read2 = pins.i2cReadBuffer(0x58, 3)

    buf[0] = 0x20;
    buf[1] = 0x03;
    pins.i2cWriteBuffer(0x58, buf)
    pause(10)
}

function sgp30_get(choose: number) : number{
    buf[0] = 0x20;
    buf[1] = 0x08;
    pins.i2cWriteBuffer(0x58, buf)
    pause(12)
    read3 = pins.i2cReadBuffer(0x58, 6)
    let list = [0, 0];
    for (let i=0; i<2; i++) {
        list[i] = read3[i * 3];
        list[i] <<=  8;
        list[i] |= read3[i * 3 + 1];
    }
    if (choose == 1) {
        return list[1];
    }
    else {
        return list[0];
    }
}

let pmat10 = 0
let pmat25 = 0
let pmat100 = 0

function PMS5003(choose1: number, choose2: number): void {
    serial.redirect(serial_list[choose1], serial_list[choose2] ,BaudRate.BaudRate9600);
    basic.pause(300);
    let check = -1;
    let Head;
	
	while (check == -1) {
        Head = serial.readBuffer(20)
        let count = 0;
        while (true) {
            if (Head.getNumber(NumberFormat.Int8LE, count) == 0x42 && Head.getNumber(NumberFormat.Int8LE, count+1) == 0x4d) {
                check = count;
            }
            else if (count > 3) {
                break;
            }
            count += 1
        }
    }
	
    pmat10 = 256*Head.getNumber(NumberFormat.Int8LE, check+10) + Head.getNumber(NumberFormat.Int8LE, check+11);
    pmat25 = 256*Head.getNumber(NumberFormat.Int8LE, check+12) + Head.getNumber(NumberFormat.Int8LE, check+13);
    pmat100 = 256*Head.getNumber(NumberFormat.Int8LE, check+14) + Head.getNumber(NumberFormat.Int8LE, check+15);

}

function PMS5003_getData(choose: number) : number{
    if (choose == 1) {
        return pmat10;
    }
    else if (choose == 2) {
        return pmat25;
    }
    else {
        return pmat100;
    }
}

/**
 * environment sensor
 */
//% weight=0 color=#0000ff icon="\uf185" block="envsensor"
namespace envsensor {

	//% blockId="init_sgp30" block="SGP30 initialization"
	//% weight=7
    export function init_sgp30(): void {
        return sgp30_init();
    }

	//% blockId="get_spg30" block="Get SGP30 %choose data"
    //% weight=6
    export function get_spg30(choose: sgp30_data): number {
        return sgp30_get(choose);
    }

	//% blockId="get_pms5003" block="PMS5003 connect RX %choose1 TX %choose2 read data"
    //% weight=5
    export function get_pms5003(choose1: soft_serial, choose2: soft_serial): void {
        return PMS5003(choose1, choose2);
    }

	//% blockId="data_pms5003" block="Get PMS5003 %choose data"
    //% weight=4
    export function data_pms5003(choose: PMS5003_data): number {
        return PMS5003_getData(choose);
    }
}
