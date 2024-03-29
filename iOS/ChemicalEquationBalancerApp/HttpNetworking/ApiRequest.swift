//
//  ApiRequest.swift
//  ChemicalEquationBalancerApp
//
//  Created by Brandon Phan on 12/16/19.
//  Copyright © 2019 Brandon Phan. All rights reserved.
//

import Foundation

class ApiRequest<Resource: ApiResource> {
    let resource: Resource
    let urlSession: URLSession
    
    init(resource: Resource, delegate: URLSessionDelegate) {
        self.resource = resource
        
        self.urlSession = URLSession(configuration: .default, delegate: delegate, delegateQueue: .main)
    }
}

extension ApiRequest: NetworkRequest {
    func decode(_ data: Data) -> Resource.ResponseBodyModelType? {
        do {
            let wrapper = try JSONDecoder().decode(Resource.ResponseBodyModelType.self, from: data)
//            print(data.prettyPrintedJSONString!)
            return wrapper
        } catch {
            print("API Response JSON Decoder: \(error.localizedDescription)")
        }
        print(data.prettyPrintedJSONString!)
        return nil
    }
    
    func run(withCompletionHandler completion: @escaping (Resource.ResponseBodyModelType?) -> Void) {
        run(resource.urlRequest, session: urlSession, withCompletionHandler: completion)
    }
}

extension Data {
    var prettyPrintedJSONString: NSString? { /// NSString gives us a nice sanitized debugDescription
        guard let object = try? JSONSerialization.jsonObject(with: self, options: []),
            let data = try? JSONSerialization.data(withJSONObject: object, options: [.prettyPrinted]),
              let prettyPrintedString = NSString(data: data, encoding: String.Encoding.utf8.rawValue) else { return nil }

        return prettyPrintedString
    }
}
