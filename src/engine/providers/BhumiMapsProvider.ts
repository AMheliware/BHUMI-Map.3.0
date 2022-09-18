import {MapProvider} from './MapProvider';


/**
 * Bhumi Height maps tile server.
 * Works with any service that uses a address/zoom/x/y.format URL for tile access.
 */
export class BhumiMapsProvider extends MapProvider 
{
	/**
	* Map server address.
	*
	* By default the open OSM tile server is used.
	*/
	public address: string;

	/**
	* Map image tile format.
	*/
	public format: string;

	/**
	 * Elevation Exaggeration coefficient
	 */
	public elevExaggeration: number;

	/**
	 * Level
	 */
	public level = 0;

	public constructor(address = 'gurugram terrain tiles/', elevExaggeration = 1)
	{
		// console.log('HEIGHT Bhumi');
		super();

		this.address = address;
		this.format = 'png';
		this.maxZoom = 19;
		this.elevExaggeration = elevExaggeration;
	}

	public fetchTile(zoom: number, x: number, y: number): Promise<any>
	{
		this.level = zoom;
		return new Promise<HTMLImageElement>((resolve, reject) => 
		{
			const image = document.createElement('img');
			image.onload = function() 
			{
				resolve(image);
			};
			image.onerror = function() 
			{
				reject();
			};
			image.crossOrigin = 'Anonymous';

			const tmsY = (1 << zoom) - y - 1;
			image.src = this.address + zoom + '/' + x + '/' + tmsY + '.' + this.format;
		});
	}
}